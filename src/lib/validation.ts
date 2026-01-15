import { z } from "zod";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};

// Sanitize input to prevent XSS attacks using HTML entity encoding
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Create a temporary element to safely encode HTML
  const div = document.createElement('div');
  div.textContent = input;
  const encoded = div.innerHTML;
  
  // Additional protection against specific XSS vectors
  return encoded
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
};

// Booking form validation schema with enhanced security
export const bookingSchema = z.object({
  fullName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .transform(sanitizeInput),
  email: z.string()
    .email("Adresse email invalide")
    .max(254, "L'email ne peut pas dépasser 254 caractères")
    .transform(val => val.toLowerCase().trim()),
  phone: z.string()
    .min(8, "Numéro de téléphone invalide")
    .max(20, "Numéro de téléphone trop long")
    .regex(/^[+\d\s()-]+$/, "Format de téléphone invalide")
    .transform(sanitizeInput),
  address: z.string()
    .min(5, "Adresse trop courte")
    .max(500, "Adresse trop longue")
    .transform(sanitizeInput),
  serviceType: z.enum(["residential", "commercial", "construction", "windows", "car"], {
    errorMap: () => ({ message: "Veuillez sélectionner un service" })
  }),
  preferredDate: z.string()
    .min(1, "Veuillez sélectionner une date")
    .refine((date) => {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, "La date ne peut pas être dans le passé"),
  preferredTime: z.string().min(1, "Veuillez sélectionner une heure"),
  message: z.string()
    .max(1000, "Le message ne peut pas dépasser 1000 caractères")
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
});

// Contact form validation schema with enhanced security
export const contactSchema = z.object({
  fullName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .transform(sanitizeInput),
  email: z.string()
    .email("Adresse email invalide")
    .max(254, "L'email ne peut pas dépasser 254 caractères")
    .transform(val => val.toLowerCase().trim()),
  phone: z.string()
    .max(20, "Numéro de téléphone trop long")
    .regex(/^[+\d\s()-]*$/, "Format de téléphone invalide")
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
  subject: z.string()
    .min(3, "Sujet trop court")
    .max(200, "Sujet trop long")
    .transform(sanitizeInput),
  message: z.string()
    .min(10, "Message trop court")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères")
    .transform(sanitizeInput),
});

// Newsletter validation with enhanced email security
export const newsletterSchema = z.object({
  email: z.string()
    .email("Adresse email invalide")
    .max(254, "L'email ne peut pas dépasser 254 caractères")
    .transform(val => val.toLowerCase().trim()),
});

// Staff email validation
export const staffEmailSchema = z.object({
  email: z.string()
    .email("Adresse email invalide")
    .max(255),
  name: z.string()
    .max(100)
    .optional()
    .transform(val => val ? sanitizeInput(val) : val),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type NewsletterFormData = z.infer<typeof newsletterSchema>;
