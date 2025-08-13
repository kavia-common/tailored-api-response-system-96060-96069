 // PUBLIC_INTERFACE
 export function extractErrorMessage(err, fallback = "An unexpected error occurred.") {
   /** 
    * Convert different error shapes (Axios/network/JSON/ValidationError arrays) into a user-friendly string.
    * - Accepts: string, Error, AxiosError, FastAPI {detail}, list of validation errors, plain objects.
    * - Returns: best-effort human-readable message, never "[object Object]".
    */
   try {
     if (!err) return fallback;
 
     // If already a string, return as-is
     if (typeof err === "string") return err;
 
     // If it's a standard Error with a message
     if (err instanceof Error && err.message) return err.message;
 
     // Axios error with response
     const response = err?.response;
     if (response) {
       const data = response.data;
       // String payload from server
       if (typeof data === "string") return data;
 
       // Object payload from server
       if (data && typeof data === "object") {
         // FastAPI typical shapes:
         // 1) { detail: "message" }
         if (typeof data.detail === "string") return data.detail;
         // 2) { detail: [{loc: [...], msg: "...", type: "..."} , ...] }
         if (Array.isArray(data.detail)) {
           const msgs = data.detail
             .map((item) => {
               if (!item) return null;
               if (typeof item === "string") return item;
               if (typeof item?.msg === "string") return item.msg;
               return null;
             })
             .filter(Boolean);
           if (msgs.length) return msgs.join("; ");
         }
         // 3) { message: "..."} or { msg: "..."} or { error: "..." }
         if (typeof data.message === "string") return data.message;
         if (typeof data.msg === "string") return data.msg;
         if (typeof data.error === "string") return data.error;
       }
 
       // Fallback to HTTP status text if available
       if (response.statusText) {
         return `${response.status || ""} ${response.statusText}`.trim();
       }
     }
 
     // Non-Axios shapes but with common fields
     if (typeof err.detail === "string") return err.detail;
     if (Array.isArray(err.detail)) {
       const msgs = err.detail
         .map((item) => (typeof item?.msg === "string" ? item.msg : null))
         .filter(Boolean);
       if (msgs.length) return msgs.join("; ");
     }
     if (typeof err.msg === "string") return err.msg;
     if (typeof err.message === "string") return err.message;
 
     // Generic object fallback: JSON stringify compactly
     if (typeof err === "object") {
       try {
         return JSON.stringify(err);
       } catch {
         return fallback;
       }
     }
 
     return String(err ?? fallback);
   } catch {
     return fallback;
   }
 }
 
 export default { extractErrorMessage };
