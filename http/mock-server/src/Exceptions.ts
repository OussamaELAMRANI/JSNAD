class HttpException extends Error {
    public status: number;
    public details: unknown

    constructor(status: number, message: string, details?: unknown) {
        super(message);

        this.name = this.constructor.name;
        this.status = status;
        this.details = details;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}


export class NotFoundException extends HttpException {
    constructor(message = "Resource not found", details?: any) {
        super(404, message, details);
    }
}