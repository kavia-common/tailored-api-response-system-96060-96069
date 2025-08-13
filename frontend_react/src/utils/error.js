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
 
 // PUBLIC_INTERFACE
 export function parseValidationErrors(err) {
   /**
    * Parse FastAPI 422 ValidationError responses into field-specific and non-field errors.
    * Returns:
    *  {
    *    fieldErrors: { [fieldName: string]: string[] },
    *    nonFieldErrors: string[],
    *    status?: number
    *  }
    * 
    * Notes:
    * - FastAPI typically returns: { detail: [{ loc: [...], msg: "...", type: "..." }, ...] }
    * - We derive the field name from the last string segment in 'loc' (ignoring 'body', 'query', etc).
    * - Unknown/absent fields aggregate into nonFieldErrors.
    */
   const result = { fieldErrors: {}, nonFieldErrors: [], status: undefined };
   try {
     const response = err?.response;
     const status = response?.status ?? err?.status;
     if (typeof status === "number") result.status = status;
 
     const data = response?.data ?? err;
     if (!data) return result;
 
     // String error body -> non field
     if (typeof data === "string") {
       result.nonFieldErrors.push(data);
       return result;
     }
 
     const pushFieldError = (field, message) => {
       if (!field || typeof field !== "string") {
         if (message) result.nonFieldErrors.push(message);
         return;
       }
       if (!result.fieldErrors[field]) result.fieldErrors[field] = [];
       if (message) result.fieldErrors[field].push(message);
     };
 
     // Prefer FastAPI { detail: ... }
     const detail = data?.detail;
     if (Array.isArray(detail)) {
       // Expected ValidationError list
       detail.forEach((item) => {
         if (!item) return;
         const msg = typeof item?.msg === "string" ? item.msg : (typeof item === "string" ? item : undefined);
         const loc = Array.isArray(item?.loc) ? item.loc : [];
 
         // Determine field: use last string in loc that isn't a known container like 'body', 'query', etc.
         let field = undefined;
         for (let i = loc.length - 1; i >= 0; i--) {
           const seg = loc[i];
           if (typeof seg === "string" && !["body", "query", "path", "form", "header"].includes(seg)) {
             field = seg;
             break;
           }
         }
 
         // Normalize known fields to our form field keys when possible
         if (field === "username") field = "email"; // OAuth2 form uses 'username' for email
         pushFieldError(field, msg);
       });
       return result;
     }
 
     if (typeof detail === "string") {
       result.nonFieldErrors.push(detail);
       return result;
     }
 
     // Other common shapes
     if (typeof data?.message === "string") {
       result.nonFieldErrors.push(data.message);
     } else if (typeof data?.msg === "string") {
       result.nonFieldErrors.push(data.msg);
     } else if (typeof data?.error === "string") {
       result.nonFieldErrors.push(data.error);
     }
 
     return result;
   } catch {
     return result;
   }
 }
 
 export default { extractErrorMessage, parseValidationErrors };
