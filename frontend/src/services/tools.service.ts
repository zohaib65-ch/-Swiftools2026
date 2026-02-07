const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const ToolsService = {
  /**
   * Upload a file for processing
   * @param {File} file 
   * @param {string} slug 
   * @param {string} token 
   * @param {object} options 
   * @returns {Promise<{jobId: string}>}
   */
  async uploadFile(file, slug, token, options = {}) {
    if (!file) throw new Error("No file provided");
    if (!token) throw new Error("Authentication required");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tool", slug);

    // Append all options to formData
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Blob) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const res = await fetch(`${BACKEND_URL}/tools/process`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Upload failed");
    }

    return await res.json(); // { jobId }
  },

  /**
   * Check job status
   * @param {string} jobId 
   * @param {string} token 
   * @returns {Promise<{status: string, resultUrl?: string, error?: string}>}
   */
  async getJobStatus(jobId, token) {
    const res = await fetch(`${BACKEND_URL}/tools/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // If 404, waiting
      if (res.status === 404) return { status: 'waiting' };
      const err = await res.json();
      throw new Error(err.message || "Status check failed");
    }

    return await res.json();
  }
};
