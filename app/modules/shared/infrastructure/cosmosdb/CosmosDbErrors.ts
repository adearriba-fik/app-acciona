import { OperationResponse } from "@azure/cosmos";

export class CosmosBathOperationError extends Error {
    public operationResponses?: OperationResponse[];

    constructor(message: string, operationResponses?: OperationResponse[] | undefined) {
        super(message);
        this.name = 'ValidationError';
        this.operationResponses = operationResponses;

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CosmosBathOperationError);
        }

        // Set prototype explicitly for instanceof to work correctly
        Object.setPrototypeOf(this, CosmosBathOperationError.prototype);
    }
}