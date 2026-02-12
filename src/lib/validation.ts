import { z } from "zod";

/**
 * Centralized validation schemas using Zod.
 * Used for API request validation and form validation.
 */

const cardNumberRegex = /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/;
const cvvRegex = /^\d{3,4}$/;

function normalizeCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

export const paymentFormSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .max(999_999.99, "Amount exceeds maximum"),
  currency: z.string().length(3, "Invalid currency code"),
  recipient: z
    .string()
    .min(2, "Recipient name is required")
    .max(100, "Recipient name is too long"),
  description: z.string().max(200, "Description is too long").optional().default(""),
  cardNumber: z
    .string()
    .transform(normalizeCardNumber)
    .refine((val) => val.replace(/\s/g, "").length === 16, "Card number must be 16 digits")
    .refine((val) => cardNumberRegex.test(val), "Invalid card format"),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Invalid month (01-12)"),
  expiryYear: z.string().regex(/^\d{2}$/, "Invalid year").refine((y) => parseInt(y, 10) >= 24, "Card expired"),
  cvv: z.string().regex(cvvRegex, "CVV must be 3 or 4 digits"),
  cardholderName: z.string().min(2, "Cardholder name is required").max(100, "Name too long"),
});

export const createPaymentSchema = paymentFormSchema
  .omit({
    cardNumber: true,
    expiryMonth: true,
    expiryYear: true,
    cvv: true,
    cardholderName: true,
  })
  .extend({
    amount: z.number().positive(),
    currency: z.string().length(3),
    recipient: z.string().min(2),
    description: z.string().optional(),
  });

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Auth validation
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const recipientSchema = z.object({
  name: z.string().min(2, "Name is required").max(100, "Name too long"),
  email: z.string().max(120).optional().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Invalid email"),
  accountNumber: z.string().max(50, "Account number too long").optional(),
});
