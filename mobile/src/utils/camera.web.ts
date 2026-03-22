// Web stub implementation for camera utilities
export const cameraUtils = {
  async requestPermissions(): Promise<boolean> {
    console.warn('Camera not available on web');
    return false;
  },

  async checkPermissions(): Promise<boolean> {
    return false;
  },

  async pickImage() {
    // Fallback to file input on web
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              uri: event.target?.result as string,
              width: 0,
              height: 0,
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  },

  async takePhoto() {
    console.warn('Camera capture not available on web');
    return null;
  },

  CameraType: { back: 'back', front: 'front' },
  Camera: null,
};

export default cameraUtils;
