package com.cybergame.exception;

public record FieldErrorResponse(
        String field,
        String message
) {
}
