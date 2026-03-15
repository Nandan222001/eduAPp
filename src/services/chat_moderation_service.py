import re
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from src.models.live_events import ChatModerationRule


class ChatModerationService:
    """
    Service for moderating live event chat messages.
    """
    
    def __init__(self, db: Session, institution_id: int):
        self.db = db
        self.institution_id = institution_id
        self._load_rules()
    
    def _load_rules(self):
        """Load active moderation rules for the institution."""
        self.rules = self.db.query(ChatModerationRule).filter(
            ChatModerationRule.institution_id == self.institution_id,
            ChatModerationRule.is_active == True
        ).all()
    
    def check_message(self, message: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if a message violates moderation rules.
        
        Args:
            message: The message to check
            
        Returns:
            Tuple of (is_allowed, action, reason)
            - is_allowed: False if message should be blocked
            - action: The action to take (flag, delete, block_user)
            - reason: The reason for moderation
        """
        message_lower = message.lower()
        
        for rule in self.rules:
            if rule.rule_type == "banned_word":
                banned_words = [word.strip().lower() for word in rule.rule_value.split(",")]
                for word in banned_words:
                    if word in message_lower:
                        return False, rule.action, f"Contains banned word: {word}"
            
            elif rule.rule_type == "regex_pattern":
                try:
                    if re.search(rule.rule_value, message, re.IGNORECASE):
                        return False, rule.action, "Matches prohibited pattern"
                except re.error:
                    continue
            
            elif rule.rule_type == "spam_detection":
                if self._is_spam(message):
                    return False, rule.action, "Detected as spam"
            
            elif rule.rule_type == "profanity":
                if self._contains_profanity(message_lower):
                    return False, rule.action, "Contains profanity"
            
            elif rule.rule_type == "url_filter":
                if self._contains_url(message):
                    return False, rule.action, "Contains unauthorized URL"
            
            elif rule.rule_type == "caps_lock":
                if self._excessive_caps(message):
                    return False, rule.action, "Excessive use of capital letters"
        
        return True, None, None
    
    def _is_spam(self, message: str) -> bool:
        """Detect spam patterns."""
        # Check for repeated characters
        if re.search(r'(.)\1{4,}', message):
            return True
        
        # Check for excessive punctuation
        punctuation_count = sum(1 for char in message if char in '!?.')
        if punctuation_count > len(message) * 0.3:
            return True
        
        return False
    
    def _contains_profanity(self, message: str) -> bool:
        """
        Check for common profanity.
        This is a basic implementation - consider using a library like better-profanity.
        """
        common_profanity = [
            'badword1', 'badword2', 'badword3'
        ]
        
        for word in common_profanity:
            if word in message:
                return True
        
        return False
    
    def _contains_url(self, message: str) -> bool:
        """Detect URLs in message."""
        url_pattern = r'https?://\S+|www\.\S+'
        return bool(re.search(url_pattern, message, re.IGNORECASE))
    
    def _excessive_caps(self, message: str) -> bool:
        """Check for excessive capital letters."""
        if len(message) < 10:
            return False
        
        caps_count = sum(1 for char in message if char.isupper())
        caps_ratio = caps_count / len(message)
        
        return caps_ratio > 0.7
    
    def moderate_message(
        self,
        message: str,
        auto_moderate: bool = True
    ) -> dict:
        """
        Moderate a message and return moderation result.
        
        Args:
            message: The message to moderate
            auto_moderate: Whether to automatically apply actions
            
        Returns:
            Dictionary with moderation result
        """
        is_allowed, action, reason = self.check_message(message)
        
        result = {
            "is_allowed": is_allowed,
            "action": action,
            "reason": reason,
            "modified_message": message
        }
        
        if not is_allowed and auto_moderate:
            if action == "delete":
                result["modified_message"] = "[Message deleted by moderator]"
            elif action == "flag":
                result["is_flagged"] = True
        
        return result
    
    def sanitize_message(self, message: str) -> str:
        """
        Sanitize message by removing/replacing problematic content.
        
        Args:
            message: The message to sanitize
            
        Returns:
            Sanitized message
        """
        # Remove excessive whitespace
        message = re.sub(r'\s+', ' ', message).strip()
        
        # Remove excessive punctuation
        message = re.sub(r'([!?.]{3,})', r'\1'[:3], message)
        
        # Remove repeated characters
        message = re.sub(r'(.)\1{3,}', r'\1\1\1', message)
        
        return message
    
    def add_rule(
        self,
        rule_type: str,
        rule_value: str,
        action: str = "flag",
        severity: str = "medium",
        created_by: Optional[int] = None
    ) -> ChatModerationRule:
        """Add a new moderation rule."""
        rule = ChatModerationRule(
            institution_id=self.institution_id,
            rule_type=rule_type,
            rule_value=rule_value,
            action=action,
            severity=severity,
            created_by=created_by,
            is_active=True
        )
        
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        
        # Reload rules
        self._load_rules()
        
        return rule
    
    def remove_rule(self, rule_id: int) -> bool:
        """Deactivate a moderation rule."""
        rule = self.db.query(ChatModerationRule).filter(
            ChatModerationRule.id == rule_id,
            ChatModerationRule.institution_id == self.institution_id
        ).first()
        
        if rule:
            rule.is_active = False
            self.db.commit()
            self._load_rules()
            return True
        
        return False
