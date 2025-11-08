// Internationalization system for CribNosh emails
import { logger } from '@/lib/utils/logger';
export interface EmailTranslations {
  welcome: {
    subject: string;
    greeting: string;
    mainMessage: string;
    features: {
      verifiedKitchens: string;
      realChefs: string;
      personalizedTaste: string;
      directConnections: string;
    };
    cta: {
      title: string;
      description: string;
      buttonText: string;
      secondaryButtonText: string;
    };
    quote: string;
  };
  orderConfirmation: {
    subject: string;
    greeting: string;
    mainMessage: string;
    orderProgress: string;
    chefInfo: string;
    deliveryInfo: string;
    trackOrder: string;
    supportMessage: string;
  };
  otpVerification: {
    subject: string;
    greeting: string;
    mainMessage: string;
    codeLabel: string;
    expiryMessage: string;
    securityNotice: string;
    securityMessage: string;
    ignoreMessage: string;
  };
  promotional: {
    subject: string;
    greeting: string;
    mainMessage: string;
    countdownLabel: string;
    howToUse: string;
    steps: {
      browse: string;
      addToCart: string;
      enterCode: string;
    };
    featuredChefs: string;
    cta: {
      title: string;
      description: string;
      buttonText: string;
      secondaryButtonText: string;
    };
    terms: string;
  };
  chefApplication: {
    subject: string;
    greeting: string;
    mainMessage: string;
    whatHappensNext: string;
    timeline: string;
    requiredDocuments: string;
    questions: string;
  };
  genericNotification: {
    subtitle: string;
    thankYou: string;
  };
  formConfirmation: {
    subject: string;
    greeting: string;
    mainMessage: string;
    submissionSummary: string;
    nextSteps: string;
    needHelp: string;
  };
  adminNotification: {
    subtitle: string;
    systemMessage: string;
  };
  common: {
    companyName: string;
    tagline: string;
    unsubscribe: string;
    support: string;
    faq: string;
    privacy: string;
    terms: string;
  };
}

// English translations
export const enTranslations: EmailTranslations = {
  welcome: {
    subject: 'Welcome to CribNosh - Your Personal Food Journey Begins!',
    greeting: 'Hi {name}!',
    mainMessage: 'We\'re absolutely thrilled to have you join our community of food lovers who appreciate authentic, home-cooked meals that celebrate cultural diversity and personal connections.',
    features: {
      verifiedKitchens: 'Verified Kitchens',
      realChefs: 'Real Food Creators',
      personalizedTaste: 'Personalized Taste',
      directConnections: 'Direct Connections',
    },
    cta: {
      title: 'Ready to Get Started?',
      description: 'Verify your email and complete your taste profile to discover amazing food creators in your area.',
      buttonText: 'Verify Your Email',
      secondaryButtonText: 'Learn More',
    },
    quote: 'Every meal tells a story, and we\'re here to help you discover yours.',
  },
  orderConfirmation: {
    subject: 'Your CribNosh order #{orderNumber} is confirmed!',
    greeting: 'Hi {customerName}!',
    mainMessage: 'Great news! Your order has been confirmed and is being prepared with care by our amazing food creators. Here\'s everything you need to know:',
    orderProgress: 'Order Progress',
    chefInfo: 'Prepared by {chefName}',
    deliveryInfo: 'Delivery Information',
    trackOrder: 'Track Your Order',
    supportMessage: 'Questions about your order? Contact your food creator directly through the CribNosh app.',
  },
  otpVerification: {
    subject: 'Verify your email with CribNosh - Your verification code is ready',
    greeting: 'Hi {recipientName}!',
    mainMessage: 'Welcome to CribNosh! We\'re excited to have you join our community of food lovers. To complete your waitlist signup, please use the verification code below:',
    codeLabel: 'Your verification code:',
    expiryMessage: 'This code expires in {expiryMinutes} minutes.',
    securityNotice: 'Security Notice:',
    securityMessage: 'Never share this code with anyone. CribNosh will never ask for your verification code via phone, email, or any other method.',
    ignoreMessage: 'If you didn\'t request this verification code, please ignore this email. Your account remains secure.',
  },
  promotional: {
    subject: 'Exclusive {discountPercentage}% off your first CribNosh order!',
    greeting: 'Hi {recipientName}!',
    mainMessage: 'We\'re excited to offer you an exclusive {discountPercentage}% discount on your first CribNosh order! This is our way of welcoming you to our community of food lovers.',
    countdownLabel: 'Offer expires in',
    howToUse: 'How to Use Your Code',
    steps: {
      browse: 'Browse our amazing food creators',
      addToCart: 'Add items to your cart',
      enterCode: 'Enter code {promotionCode} at checkout',
    },
    featuredChefs: 'Meet Our Featured Food Creators',
    cta: {
      title: 'Ready to Experience Authentic Home Cooking?',
      description: 'Use code {promotionCode} and save {discountPercentage}% on your first order. Discover amazing food creators in your area and taste the difference of home-cooked meals.',
      buttonText: 'Start Ordering Now',
      secondaryButtonText: 'Browse Creators',
    },
    terms: 'Terms & Conditions: This offer is valid for first-time customers only. Discount applies to food items only, not delivery fees. Offer expires on {expiryDate}. Cannot be combined with other offers. CribNosh reserves the right to modify or cancel this promotion at any time.',
  },
  chefApplication: {
    subject: 'Welcome to CribNosh! Your food creator application is being reviewed',
    greeting: 'Hi {chefName}!',
    mainMessage: 'Thank you for applying to share your culinary passion with CribNosh! We\'re excited about the possibility of having you join our community of amazing food creators.',
    whatHappensNext: 'What Happens Next',
    timeline: 'Timeline',
    requiredDocuments: 'Required Documents',
    questions: 'Questions? We\'re here to help! Email us at {contactEmail}',
  },
  genericNotification: {
    subtitle: 'Important Update from CribNosh',
    thankYou: 'Thank you for being part of the CribNosh community!',
  },
  formConfirmation: {
    subject: 'Your {formName} submission is confirmed',
    greeting: 'Hi {customerName}!',
    mainMessage: 'We\'ve successfully received your {formName} submission and really appreciate you taking the time to reach out to us.',
    submissionSummary: 'Your Submission Summary',
    nextSteps: 'What Happens Next',
    needHelp: 'We\'re here to help! Reply to this email or contact us at help@cribnosh.com',
  },
  adminNotification: {
    subtitle: 'Admin Notification',
    systemMessage: 'This is an automated notification from the CribNosh system.',
  },
  common: {
    companyName: 'CribNosh',
    tagline: 'Personalized Dining, Every Time',
    unsubscribe: 'Unsubscribe',
    support: 'Support',
    faq: 'FAQ',
    privacy: 'Privacy Policy',
    terms: 'Terms',
  },
};

// Spanish translations
export const esTranslations: EmailTranslations = {
  welcome: {
    subject: '¡Bienvenido a CribNosh - Tu Viaje Culinario Personal Comienza!',
    greeting: '¡Hola {name}!',
    mainMessage: 'Estamos emocionados de tenerte en nuestra comunidad de amantes de la comida que aprecian las comidas caseras auténticas que celebran la diversidad cultural y las conexiones personales.',
    features: {
      verifiedKitchens: 'Cocinas Verificadas',
      realChefs: 'Creadores de Comida Reales',
      personalizedTaste: 'Sabor Personalizado',
      directConnections: 'Conexiones Directas',
    },
    cta: {
      title: '¿Listo para Empezar?',
      description: 'Verifica tu email y completa tu perfil de sabor para descubrir increíbles creadores de comida en tu área.',
      buttonText: 'Verificar Email',
      secondaryButtonText: 'Saber Más',
    },
    quote: 'Cada comida cuenta una historia, y estamos aquí para ayudarte a descubrir la tuya.',
  },
  orderConfirmation: {
    subject: '¡Tu pedido CribNosh #{orderNumber} está confirmado!',
    greeting: '¡Hola {customerName}!',
    mainMessage: '¡Excelentes noticias! Tu pedido ha sido confirmado y está siendo preparado con cuidado por nuestros increíbles creadores de comida. Aquí está todo lo que necesitas saber:',
    orderProgress: 'Progreso del Pedido',
    chefInfo: 'Preparado por {chefName}',
    deliveryInfo: 'Información de Entrega',
    trackOrder: 'Rastrear Pedido',
    supportMessage: '¿Preguntas sobre tu pedido? Contacta a tu creador de comida directamente a través de la app de CribNosh.',
  },
  otpVerification: {
    subject: 'Verifica tu email con CribNosh - Tu código de verificación está listo',
    greeting: '¡Hola {recipientName}!',
    mainMessage: '¡Bienvenido a CribNosh! Estamos emocionados de tenerte en nuestra comunidad de amantes de la comida. Para completar tu registro en la lista de espera, por favor usa el código de verificación de abajo:',
    codeLabel: 'Tu código de verificación:',
    expiryMessage: 'Este código expira en {expiryMinutes} minutos.',
    securityNotice: 'Aviso de Seguridad:',
    securityMessage: 'Nunca compartas este código con nadie. CribNosh nunca te pedirá tu código de verificación por teléfono, email o cualquier otro método.',
    ignoreMessage: 'Si no solicitaste este código de verificación, por favor ignora este email. Tu cuenta permanece segura.',
  },
  promotional: {
    subject: '¡Descuento exclusivo del {discountPercentage}% en tu primer pedido CribNosh!',
    greeting: '¡Hola {recipientName}!',
    mainMessage: '¡Estamos emocionados de ofrecerte un descuento exclusivo del {discountPercentage}% en tu primer pedido CribNosh! Esta es nuestra forma de darte la bienvenida a nuestra comunidad de amantes de la comida.',
    countdownLabel: 'La oferta expira en',
    howToUse: 'Cómo Usar Tu Código',
    steps: {
      browse: 'Explora nuestros increíbles creadores de comida',
      addToCart: 'Agrega artículos a tu carrito',
      enterCode: 'Ingresa el código {promotionCode} al finalizar la compra',
    },
    featuredChefs: 'Conoce a Nuestros Creadores de Comida Destacados',
    cta: {
      title: '¿Listo para Experimentar la Cocina Casera Auténtica?',
      description: 'Usa el código {promotionCode} y ahorra {discountPercentage}% en tu primer pedido. Descubre increíbles creadores de comida en tu área y saborea la diferencia de las comidas caseras.',
      buttonText: 'Comenzar a Pedir Ahora',
      secondaryButtonText: 'Explorar Creadores',
    },
    terms: 'Términos y Condiciones: Esta oferta es válida solo para clientes nuevos. El descuento aplica solo a artículos de comida, no a tarifas de entrega. La oferta expira el {expiryDate}. No se puede combinar con otras ofertas. CribNosh se reserva el derecho de modificar o cancelar esta promoción en cualquier momento.',
  },
  chefApplication: {
    subject: '¡Bienvenido a CribNosh! Tu aplicación como creador de comida está siendo revisada',
    greeting: '¡Hola {chefName}!',
    mainMessage: '¡Gracias por aplicar para compartir tu pasión culinaria con CribNosh! Estamos emocionados sobre la posibilidad de tenerte en nuestra comunidad de increíbles creadores de comida.',
    whatHappensNext: 'Qué Sucede Después',
    timeline: 'Cronograma',
    requiredDocuments: 'Documentos Requeridos',
    questions: '¿Preguntas? ¡Estamos aquí para ayudar! Envíanos un email a {contactEmail}',
  },
  genericNotification: {
    subtitle: 'Actualización Importante de CribNosh',
    thankYou: '¡Gracias por ser parte de la comunidad CribNosh!',
  },
  formConfirmation: {
    subject: 'Tu envío de {formName} está confirmado',
    greeting: '¡Hola {customerName}!',
    mainMessage: 'Hemos recibido exitosamente tu envío de {formName} y realmente apreciamos que te hayas tomado el tiempo de contactarnos.',
    submissionSummary: 'Resumen de Tu Envío',
    nextSteps: 'Qué Sucede Después',
    needHelp: '¡Estamos aquí para ayudar! Responde a este email o contáctanos en help@cribnosh.com',
  },
  adminNotification: {
    subtitle: 'Notificación de Administrador',
    systemMessage: 'Esta es una notificación automatizada del sistema CribNosh.',
  },
  common: {
    companyName: 'CribNosh',
    tagline: 'Comida Personalizada, Cada Vez',
    unsubscribe: 'Cancelar Suscripción',
    support: 'Soporte',
    faq: 'Preguntas Frecuentes',
    privacy: 'Política de Privacidad',
    terms: 'Términos',
  },
};

// French translations
export const frTranslations: EmailTranslations = {
  welcome: {
    subject: 'Bienvenue chez CribNosh - Votre Voyage Culinaire Personnel Commence !',
    greeting: 'Salut {name} !',
    mainMessage: 'Nous sommes ravis de vous accueillir dans notre communauté d\'amoureux de la cuisine qui apprécient les repas authentiques faits maison qui célèbrent la diversité culturelle et les connexions personnelles.',
    features: {
      verifiedKitchens: 'Cuisines Vérifiées',
      realChefs: 'Vrais Créateurs de Nourriture',
      personalizedTaste: 'Goût Personnalisé',
      directConnections: 'Connexions Directes',
    },
    cta: {
      title: 'Prêt à Commencer ?',
      description: 'Vérifiez votre email et complétez votre profil gustatif pour découvrir d\'incroyables créateurs de nourriture dans votre région.',
      buttonText: 'Vérifier l\'Email',
      secondaryButtonText: 'En Savoir Plus',
    },
    quote: 'Chaque repas raconte une histoire, et nous sommes là pour vous aider à découvrir la vôtre.',
  },
  orderConfirmation: {
    subject: 'Votre commande CribNosh #{orderNumber} est confirmée !',
    greeting: 'Salut {customerName} ! 👋',
    mainMessage: 'Excellente nouvelle ! Votre commande a été confirmée et est préparée avec soin par nos incroyables créateurs de nourriture. Voici tout ce que vous devez savoir :',
    orderProgress: 'Progrès de la Commande',
    chefInfo: 'Préparé par {chefName}',
    deliveryInfo: 'Informations de Livraison',
    trackOrder: 'Suivre la Commande',
    supportMessage: 'Des questions sur votre commande ? Contactez votre créateur de nourriture directement via l\'app CribNosh.',
  },
  otpVerification: {
    subject: 'Vérifiez votre email avec CribNosh - Votre code de vérification est prêt',
    greeting: 'Salut {recipientName} ! 👋',
    mainMessage: 'Bienvenue chez CribNosh ! Nous sommes ravis de vous accueillir dans notre communauté d\'amoureux de la cuisine. Pour compléter votre inscription sur la liste d\'attente, veuillez utiliser le code de vérification ci-dessous :',
    codeLabel: 'Votre code de vérification :',
    expiryMessage: 'Ce code expire dans {expiryMinutes} minutes.',
    securityNotice: 'Avis de Sécurité :',
    securityMessage: 'Ne partagez jamais ce code avec qui que ce soit. CribNosh ne vous demandera jamais votre code de vérification par téléphone, email ou tout autre moyen.',
    ignoreMessage: 'Si vous n\'avez pas demandé ce code de vérification, veuillez ignorer cet email. Votre compte reste sécurisé.',
  },
  promotional: {
    subject: 'Réduction exclusive de {discountPercentage}% sur votre première commande CribNosh !',
    greeting: 'Salut {recipientName} ! 👋',
    mainMessage: 'Nous sommes ravis de vous offrir une réduction exclusive de {discountPercentage}% sur votre première commande CribNosh ! C\'est notre façon de vous souhaiter la bienvenue dans notre communauté d\'amoureux de la cuisine.',
    countdownLabel: 'L\'offre expire dans',
    howToUse: 'Comment Utiliser Votre Code',
    steps: {
      browse: 'Parcourez nos incroyables créateurs de nourriture',
      addToCart: 'Ajoutez des articles à votre panier',
      enterCode: 'Entrez le code {promotionCode} à la caisse',
    },
    featuredChefs: 'Rencontrez Nos Créateurs de Nourriture Vedettes',
    cta: {
      title: 'Prêt à Découvrir la Cuisine Maison Authentique ?',
      description: 'Utilisez le code {promotionCode} et économisez {discountPercentage}% sur votre première commande. Découvrez d\'incroyables créateurs de nourriture dans votre région et goûtez la différence des repas faits maison.',
      buttonText: 'Commencez à Commander Maintenant',
      secondaryButtonText: 'Parcourir les Créateurs',
    },
    terms: 'Termes et Conditions : Cette offre est valable uniquement pour les nouveaux clients. La réduction s\'applique uniquement aux articles alimentaires, pas aux frais de livraison. L\'offre expire le {expiryDate}. Ne peut pas être combinée avec d\'autres offres. CribNosh se réserve le droit de modifier ou d\'annuler cette promotion à tout moment.',
  },
  chefApplication: {
    subject: 'Bienvenue chez CribNosh ! Votre candidature de créateur de nourriture est en cours d\'examen',
    greeting: 'Salut {chefName} ! 👋',
    mainMessage: 'Merci de postuler pour partager votre passion culinaire avec CribNosh ! Nous sommes ravis de la possibilité de vous avoir dans notre communauté d\'incroyables créateurs de nourriture.',
    whatHappensNext: 'Ce qui se Passe Ensuite',
    timeline: 'Calendrier',
    requiredDocuments: 'Documents Requis',
    questions: 'Des questions ? Nous sommes là pour vous aider ! Envoyez-nous un email à {contactEmail}',
  },
  genericNotification: {
    subtitle: 'Mise à Jour Importante de CribNosh',
    thankYou: 'Merci de faire partie de la communauté CribNosh !',
  },
  formConfirmation: {
    subject: 'Votre soumission {formName} est confirmée',
    greeting: 'Salut {customerName} ! 👋',
    mainMessage: 'Nous avons reçu avec succès votre soumission {formName} et nous apprécions vraiment que vous ayez pris le temps de nous contacter.',
    submissionSummary: 'Résumé de Votre Soumission',
    nextSteps: 'Ce qui se Passe Ensuite',
    needHelp: 'Nous sommes là pour vous aider ! Répondez à cet email ou contactez-nous à help@cribnosh.com',
  },
  adminNotification: {
    subtitle: 'Notification d\'Administrateur',
    systemMessage: 'Ceci est une notification automatisée du système CribNosh.',
  },
  common: {
    companyName: 'CribNosh',
    tagline: 'Cuisine Personnalisée, À Chaque Fois',
    unsubscribe: 'Se Désabonner',
    support: 'Support',
    faq: 'FAQ',
    privacy: 'Politique de Confidentialité',
    terms: 'Termes',
  },
};

// Language detection and translation utilities
export const supportedLanguages = ['en', 'es', 'fr'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const translations: Record<SupportedLanguage, EmailTranslations> = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
};

// Translation utility functions
export const translate = (lang: SupportedLanguage, key: string, variables: Record<string, string | number> = {}): string => {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    logger.warn(`Translation key "${key}" not found for language "${lang}"`);
    return key;
  }
  
  // Replace variables in the translation
  return value.replace(/\{(\w+)\}/g, (match, varName) => {
    return String(variables[varName] || match);
  });
};

// Detect language from user preferences or email content
export const detectLanguage = (userPreferences?: {
  language?: string;
  country?: string;
  email?: string;
}): SupportedLanguage => {
  if (userPreferences?.language) {
    const lang = userPreferences.language.toLowerCase().split('-')[0];
    if (supportedLanguages.includes(lang as SupportedLanguage)) {
      return lang as SupportedLanguage;
    }
  }
  
  // Fallback to English
  return 'en';
};

// Get localized email subject
export const getLocalizedSubject = (
  templateName: keyof EmailTranslations,
  lang: SupportedLanguage,
  variables: Record<string, string | number> = {}
): string => {
  return translate(lang, `${templateName}.subject`, variables);
};

// Get localized email content
export const getLocalizedContent = (
  templateName: keyof EmailTranslations,
  lang: SupportedLanguage,
  variables: Record<string, string | number> = {}
): Partial<EmailTranslations[keyof EmailTranslations]> => {
  const template = translations[lang][templateName];
  const localizedTemplate: any = {};
  
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string') {
      localizedTemplate[key] = translate(lang, `${templateName}.${key}`, variables);
    } else if (typeof value === 'object' && value !== null) {
      localizedTemplate[key] = {};
      for (const [subKey, subValue] of Object.entries(value)) {
        if (typeof subValue === 'string') {
          localizedTemplate[key][subKey] = translate(lang, `${templateName}.${key}.${subKey}`, variables);
        }
      }
    }
  }
  
  return localizedTemplate;
};

export default {
  supportedLanguages,
  languageNames,
  translations,
  translate,
  detectLanguage,
  getLocalizedSubject,
  getLocalizedContent,
};
