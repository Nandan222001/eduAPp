// Web implementation for document scanner using File API
export const documentScannerService = {
  async pickDocument(): Promise<any> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          resolve({
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            size: file.size,
          });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  },

  async readFile(uri: string): Promise<string | null> {
    try {
      const response = await fetch(uri);
      return await response.text();
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  },
};

export default documentScannerService;
