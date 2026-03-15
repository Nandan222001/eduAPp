import secrets
import hashlib
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.models.live_events import LiveEvent, EventTicket
from src.models.user import User


class EventTicketService:
    """Service for managing event tickets and payments."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_ticket_code(self, event_id: int, user_id: int) -> str:
        """Generate a unique ticket code."""
        random_part = secrets.token_urlsafe(16)
        hash_input = f"{event_id}-{user_id}-{datetime.utcnow().timestamp()}-{random_part}"
        hash_digest = hashlib.sha256(hash_input.encode()).hexdigest()[:12].upper()
        return f"TKT-{event_id}-{hash_digest}"
    
    def create_ticket(
        self,
        live_event_id: int,
        user_id: int,
        amount_paid: int,
        currency: str = "INR",
        payment_id: Optional[str] = None,
        payment_gateway: Optional[str] = None
    ) -> EventTicket:
        """
        Create a new event ticket.
        
        Args:
            live_event_id: ID of the live event
            user_id: ID of the user purchasing the ticket
            amount_paid: Amount paid in smallest currency unit
            currency: Currency code
            payment_id: Payment gateway transaction ID
            payment_gateway: Name of payment gateway used
            
        Returns:
            Created EventTicket instance
        """
        # Check if event exists and monetization is enabled
        event = self.db.query(LiveEvent).filter(
            LiveEvent.id == live_event_id
        ).first()
        
        if not event:
            raise ValueError("Event not found")
        
        if not event.monetization_enabled:
            raise ValueError("Event does not require tickets")
        
        # Check if user already has a valid ticket
        existing_ticket = self.db.query(EventTicket).filter(
            EventTicket.live_event_id == live_event_id,
            EventTicket.user_id == user_id,
            EventTicket.payment_status == "completed",
            EventTicket.is_refunded == False
        ).first()
        
        if existing_ticket:
            return existing_ticket
        
        # Generate ticket code
        ticket_code = self.generate_ticket_code(live_event_id, user_id)
        
        # Create ticket
        ticket = EventTicket(
            live_event_id=live_event_id,
            user_id=user_id,
            ticket_code=ticket_code,
            amount_paid=amount_paid,
            currency=currency,
            payment_id=payment_id,
            payment_gateway=payment_gateway,
            payment_status="pending"
        )
        
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        
        return ticket
    
    def complete_payment(self, ticket_id: int, payment_id: str) -> EventTicket:
        """Mark ticket payment as completed."""
        ticket = self.db.query(EventTicket).filter(
            EventTicket.id == ticket_id
        ).first()
        
        if not ticket:
            raise ValueError("Ticket not found")
        
        ticket.payment_status = "completed"
        ticket.payment_id = payment_id
        
        self.db.commit()
        self.db.refresh(ticket)
        
        return ticket
    
    def fail_payment(self, ticket_id: int) -> EventTicket:
        """Mark ticket payment as failed."""
        ticket = self.db.query(EventTicket).filter(
            EventTicket.id == ticket_id
        ).first()
        
        if not ticket:
            raise ValueError("Ticket not found")
        
        ticket.payment_status = "failed"
        
        self.db.commit()
        self.db.refresh(ticket)
        
        return ticket
    
    def redeem_ticket(self, ticket_code: str, user_id: int) -> EventTicket:
        """
        Redeem a ticket for event access.
        
        Args:
            ticket_code: Unique ticket code
            user_id: ID of the user redeeming the ticket
            
        Returns:
            Redeemed EventTicket instance
        """
        ticket = self.db.query(EventTicket).filter(
            EventTicket.ticket_code == ticket_code,
            EventTicket.user_id == user_id
        ).first()
        
        if not ticket:
            raise ValueError("Invalid ticket code")
        
        if ticket.payment_status != "completed":
            raise ValueError("Ticket payment not completed")
        
        if ticket.is_refunded:
            raise ValueError("Ticket has been refunded")
        
        if ticket.is_redeemed:
            return ticket  # Already redeemed, return existing
        
        ticket.is_redeemed = True
        ticket.redeemed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(ticket)
        
        return ticket
    
    def refund_ticket(
        self,
        ticket_id: int,
        reason: Optional[str] = None
    ) -> EventTicket:
        """
        Refund a ticket.
        
        Args:
            ticket_id: ID of the ticket to refund
            reason: Reason for refund
            
        Returns:
            Refunded EventTicket instance
        """
        ticket = self.db.query(EventTicket).filter(
            EventTicket.id == ticket_id
        ).first()
        
        if not ticket:
            raise ValueError("Ticket not found")
        
        if ticket.is_refunded:
            raise ValueError("Ticket already refunded")
        
        ticket.is_refunded = True
        ticket.refunded_at = datetime.utcnow()
        ticket.refund_reason = reason
        ticket.payment_status = "refunded"
        
        self.db.commit()
        self.db.refresh(ticket)
        
        return ticket
    
    def verify_ticket(self, ticket_code: str) -> dict:
        """
        Verify a ticket's validity.
        
        Args:
            ticket_code: Unique ticket code
            
        Returns:
            Dictionary with verification result
        """
        ticket = self.db.query(EventTicket).filter(
            EventTicket.ticket_code == ticket_code
        ).first()
        
        if not ticket:
            return {
                "valid": False,
                "reason": "Ticket not found"
            }
        
        if ticket.payment_status != "completed":
            return {
                "valid": False,
                "reason": "Payment not completed"
            }
        
        if ticket.is_refunded:
            return {
                "valid": False,
                "reason": "Ticket has been refunded"
            }
        
        # Get event details
        event = self.db.query(LiveEvent).filter(
            LiveEvent.id == ticket.live_event_id
        ).first()
        
        return {
            "valid": True,
            "ticket_id": ticket.id,
            "event_id": ticket.live_event_id,
            "event_name": event.event_name if event else None,
            "user_id": ticket.user_id,
            "is_redeemed": ticket.is_redeemed,
            "redeemed_at": ticket.redeemed_at
        }
    
    def get_user_tickets(
        self,
        user_id: int,
        include_refunded: bool = False
    ) -> list:
        """Get all tickets for a user."""
        query = self.db.query(EventTicket).filter(
            EventTicket.user_id == user_id
        )
        
        if not include_refunded:
            query = query.filter(EventTicket.is_refunded == False)
        
        return query.all()
    
    def get_event_tickets(
        self,
        live_event_id: int,
        payment_status: Optional[str] = None
    ) -> list:
        """Get all tickets for an event."""
        query = self.db.query(EventTicket).filter(
            EventTicket.live_event_id == live_event_id
        )
        
        if payment_status:
            query = query.filter(EventTicket.payment_status == payment_status)
        
        return query.all()
    
    def get_event_revenue(self, live_event_id: int) -> dict:
        """Calculate total revenue for an event."""
        from sqlalchemy import func
        
        # Total revenue from completed payments
        completed_revenue = self.db.query(
            func.sum(EventTicket.amount_paid)
        ).filter(
            EventTicket.live_event_id == live_event_id,
            EventTicket.payment_status == "completed",
            EventTicket.is_refunded == False
        ).scalar() or 0
        
        # Total refunded amount
        refunded_amount = self.db.query(
            func.sum(EventTicket.amount_paid)
        ).filter(
            EventTicket.live_event_id == live_event_id,
            EventTicket.is_refunded == True
        ).scalar() or 0
        
        # Ticket counts
        total_tickets = self.db.query(EventTicket).filter(
            EventTicket.live_event_id == live_event_id
        ).count()
        
        completed_tickets = self.db.query(EventTicket).filter(
            EventTicket.live_event_id == live_event_id,
            EventTicket.payment_status == "completed",
            EventTicket.is_refunded == False
        ).count()
        
        refunded_tickets = self.db.query(EventTicket).filter(
            EventTicket.live_event_id == live_event_id,
            EventTicket.is_refunded == True
        ).count()
        
        return {
            "total_revenue": completed_revenue,
            "refunded_amount": refunded_amount,
            "net_revenue": completed_revenue - refunded_amount,
            "total_tickets": total_tickets,
            "completed_tickets": completed_tickets,
            "refunded_tickets": refunded_tickets
        }
