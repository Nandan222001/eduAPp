import axios from '@/lib/axios';
import {
  Credential,
  CredentialShare,
  CredentialStatistics,
  ShareCredentialRequest,
  VerifyCredentialRequest,
  PublicCredentialVerificationResponse,
} from '@/types/credential';

export const credentialsApi = {
  getMyCredentials: async (skip = 0, limit = 100): Promise<Credential[]> => {
    const response = await axios.get('/credentials/my-credentials', {
      params: { skip, limit },
    });
    return response.data;
  },

  getCredentialById: async (id: number): Promise<Credential> => {
    const response = await axios.get(`/credentials/${id}`);
    return response.data;
  },

  getCredentialStatistics: async (): Promise<CredentialStatistics> => {
    const response = await axios.get('/credentials/statistics');
    return response.data;
  },

  createShareLink: async (
    credentialId: number,
    data: ShareCredentialRequest
  ): Promise<CredentialShare> => {
    const response = await axios.post(`/credentials/${credentialId}/share`, data);
    return response.data;
  },

  verifyCredential: async (
    request: VerifyCredentialRequest
  ): Promise<PublicCredentialVerificationResponse> => {
    const response = await axios.post('/credentials/verify', request);
    return response.data;
  },

  verifyByCertificateNumber: async (
    certificateNumber: string
  ): Promise<PublicCredentialVerificationResponse> => {
    const response = await axios.get(`/credentials/verify/certificate/${certificateNumber}`);
    return response.data;
  },

  getSharedCredential: async (shareToken: string): Promise<unknown> => {
    const response = await axios.get(`/credentials/share/credential/${shareToken}`);
    return response.data;
  },

  downloadCredentialAsJSON: async (credential: Credential): Promise<void> => {
    const dataStr = JSON.stringify(credential, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `credential-${credential.certificate_number}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  downloadCredentialAsPDF: async (credentialId: number): Promise<void> => {
    const response = await axios.get(`/credentials/${credentialId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `credential-${credentialId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getBlockchainHistory: async (certificateNumber: string): Promise<unknown> => {
    const response = await axios.get(`/employer/credential/${certificateNumber}/history`);
    return response.data;
  },
};

export default credentialsApi;
