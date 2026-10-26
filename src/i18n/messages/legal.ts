import { defineMessages } from "../define";

/**
 * Privacy policy and terms of service. Each section has a title and any of:
 * intro (paragraph), subs (sub-headings with a paragraph), items (bullets),
 * outro (closing paragraph). **text** renders bold.
 */
export const legal = defineMessages({
  en: {
    common: {
      updated: "Last updated: {date}",
      email: "Email",
      phone: "Phone",
      address: "Address",
      addressValue: "Douala, Cameroon · Shenzhen, China",
    },
    privacy: {
      title: "Privacy Policy",
      description: "How AfrikWholesaler collects, uses, and protects your data.",
      sections: {
        intro: {
          title: "1. Introduction",
          intro: "AfrikWholesaler (\"we\", \"us\", or \"our\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services. Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.",
        },
        collect: {
          title: "2. Information We Collect",
          intro: "We may collect information about you in a variety of ways. The information we may collect includes:",
          subs: {
            personal: { h: "Personal Data", p: "Personally identifiable information, such as your name, email address, phone number, company name, and country, that you voluntarily give to us when registering for an account or submitting a quote request." },
            derivative: { h: "Derivative Data", p: "Information our servers automatically collect when you access the platform, such as your IP address, browser type, operating system, and access times." },
            financial: { h: "Financial Data", p: "Financial information related to your orders, payment methods, and transaction history. We do not store full card numbers — payments are processed through secure third-party payment providers." },
          },
        },
        use: {
          title: "3. How We Use Your Information",
          intro: "We use the information we collect in the following ways:",
          items: [
            "To create and manage your account and provide customer support",
            "To process and fulfill your orders, quote requests, and shipments",
            "To send you order confirmations, shipping updates, and service notifications",
            "To improve our platform, products, and services based on your feedback",
            "To detect, prevent, and address technical issues, fraud, or security violations",
          ],
        },
        sharing: {
          title: "4. Sharing Your Information",
          intro: "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:",
          items: [
            "With logistics partners and freight forwarders for the purpose of shipping your orders",
            "With payment processors to complete transactions securely",
            "When required by law, court order, or government regulation",
            "In connection with a business merger, acquisition, or asset sale",
          ],
        },
        security: {
          title: "5. Data Security",
          intro: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encrypted data transmission (SSL/TLS), secure password hashing, and restricted access controls. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
        },
        rights: {
          title: "6. Your Data Rights",
          intro: "You have the following rights regarding your personal information:",
          items: [
            "**Access:** Request a copy of the personal data we hold about you",
            "**Correction:** Request that we correct inaccurate or incomplete data",
            "**Deletion:** Request that we delete your personal data (subject to legal requirements)",
            "**Opt-out:** Unsubscribe from marketing communications at any time",
          ],
        },
        cookies: {
          title: "7. Cookies and Session Data",
          intro: "We use cookies and similar technologies to maintain your login session, remember your preferences (such as your language), and analyze platform usage. Authentication cookies are used to keep you logged in across visits. You can control cookie settings through your browser, but disabling cookies may affect platform functionality.",
        },
        changes: {
          title: "8. Changes to This Policy",
          intro: "We reserve the right to modify this Privacy Policy at any time. Changes will be posted on this page with an updated revision date. We encourage you to review this page periodically to stay informed about how we protect your information.",
        },
        contact: {
          title: "9. Contact Us",
          intro: "If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:",
        },
      },
    },
    terms: {
      title: "Terms of Service",
      description: "Terms and conditions for using AfrikWholesaler services.",
      sections: {
        acceptance: {
          title: "1. Acceptance of Terms",
          intro: "By accessing or using AfrikWholesaler's website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services. These terms apply to all visitors, users, and others who access or use the platform.",
        },
        account: {
          title: "2. Account Registration",
          intro: "To access certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.",
        },
        pricing: {
          title: "3. Pricing and Orders",
          intro: "All prices displayed on the platform are subject to change without notice. Bulk pricing tiers are based on quantity and are indicated on each product page. Quote requests are not binding orders; a formal quote issued by AfrikWholesaler constitutes the final pricing. Orders are confirmed only after acceptance and payment of any required deposit.",
        },
        shipping: {
          title: "4. Shipping Responsibility Disclaimer",
          intro: "**Important:** AfrikWholesaler facilitates sourcing, quality inspection, and logistics coordination on behalf of the buyer. However, once a shipment is dispatched from the origin warehouse, AfrikWholesaler **declines any and all responsibility** for problems that may arise during shipping, including but not limited to:",
          items: [
            "Shipping delays caused by carriers, customs, weather, or force majeure events",
            "Loss, damage, or theft of goods during transit",
            "Customs clearance delays, holds, or confiscation by destination country authorities",
            "Incorrect or incomplete shipping addresses provided by the buyer",
            "Failure of third-party logistics providers or freight forwarders",
          ],
          outro: "By placing an order, the buyer acknowledges these risks and accepts full responsibility for the shipment once it leaves the origin facility. We recommend that buyers arrange appropriate shipping insurance through their own providers if desired.",
        },
        refunds: {
          title: "5. No Refund Policy",
          intro: "**All sales are final.** AfrikWholesaler does not offer refunds, returns, or exchanges under any circumstances, including:",
          items: [
            "Products damaged or lost during shipping",
            "Shipping delays or non-delivery due to customs or carrier issues",
            "Change of mind or incorrect product selection after order confirmation",
            "Minor product variations in color, size, or specification from factory production",
            "Orders cancelled after production or dispatch has begun",
          ],
          outro: "In the rare event that a product arrives with a manufacturing defect verified by our quality inspection team prior to dispatch, AfrikWholesaler may, at its sole discretion, offer a replacement or credit toward a future order. This does not constitute a guarantee and is handled on a case-by-case basis.",
        },
        quality: {
          title: "6. Quality Inspection",
          intro: "AfrikWholesaler conducts quality inspection on all orders before dispatch. This inspection covers product count, visible defects, and specification matching. Our quality inspection is a value-added service and does not guarantee that products will arrive in the same condition after shipping, as we are not responsible for transit conditions (see Section 4).",
        },
        ip: {
          title: "7. Intellectual Property",
          intro: "All content on this platform, including text, graphics, logos, images, and software, is the property of AfrikWholesaler or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works from any content without prior written consent.",
        },
        liability: {
          title: "8. Limitation of Liability",
          intro: "AfrikWholesaler shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform or services, including but not limited to loss of profits, data, or business opportunities. Our total liability shall not exceed the amount paid by you for the specific order giving rise to the claim.",
        },
        law: {
          title: "9. Governing Law",
          intro: "These Terms shall be governed by and construed in accordance with the laws of Cameroon, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of Douala, Cameroon.",
        },
        changes: {
          title: "10. Changes to Terms",
          intro: "AfrikWholesaler reserves the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated revision date. Your continued use of the platform after changes are posted constitutes acceptance of the modified terms.",
        },
        contact: {
          title: "11. Contact Us",
          intro: "If you have questions about these Terms of Service, please contact us at:",
        },
      },
    },
  },
  fr: {
    common: {
      updated: "Dernière mise à jour : {date}",
      email: "E-mail",
      phone: "Téléphone",
      address: "Adresse",
      addressValue: "Douala, Cameroun · Shenzhen, Chine",
    },
    privacy: {
      title: "Politique de confidentialité",
      description: "Comment AfrikWholesaler collecte, utilise et protège vos données.",
      sections: {
        intro: {
          title: "1. Introduction",
          intro: "AfrikWholesaler (« nous », « notre ») s'engage à protéger votre vie privée. La présente politique de confidentialité explique comment nous collectons, utilisons, communiquons et protégeons vos informations lorsque vous utilisez notre plateforme et nos services. Veuillez la lire attentivement. Si vous n'acceptez pas ses termes, veuillez ne pas accéder à la plateforme.",
        },
        collect: {
          title: "2. Informations que nous collectons",
          intro: "Nous pouvons collecter des informations vous concernant de différentes manières. Ces informations comprennent :",
          subs: {
            personal: { h: "Données personnelles", p: "Les informations permettant de vous identifier, telles que votre nom, votre adresse e-mail, votre numéro de téléphone, le nom de votre entreprise et votre pays, que vous nous fournissez volontairement lors de la création d'un compte ou d'une demande de devis." },
            derivative: { h: "Données techniques", p: "Les informations que nos serveurs collectent automatiquement lorsque vous accédez à la plateforme, comme votre adresse IP, le type de navigateur, le système d'exploitation et les heures de connexion." },
            financial: { h: "Données financières", p: "Les informations financières liées à vos commandes, moyens de paiement et historique de transactions. Nous ne conservons pas les numéros de carte complets — les paiements sont traités par des prestataires de paiement tiers sécurisés." },
          },
        },
        use: {
          title: "3. Utilisation de vos informations",
          intro: "Nous utilisons les informations collectées pour :",
          items: [
            "Créer et gérer votre compte et assurer le service client",
            "Traiter et exécuter vos commandes, demandes de devis et expéditions",
            "Vous envoyer les confirmations de commande, le suivi d'expédition et les notifications de service",
            "Améliorer notre plateforme, nos produits et nos services grâce à vos retours",
            "Détecter, prévenir et traiter les problèmes techniques, la fraude ou les atteintes à la sécurité",
          ],
        },
        sharing: {
          title: "4. Partage de vos informations",
          intro: "Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles à des tiers sans votre consentement, sauf dans les cas suivants :",
          items: [
            "Avec nos partenaires logistiques et transitaires pour l'expédition de vos commandes",
            "Avec les prestataires de paiement pour sécuriser les transactions",
            "Lorsque la loi, une décision de justice ou une réglementation l'exige",
            "Dans le cadre d'une fusion, d'une acquisition ou d'une cession d'actifs",
          ],
        },
        security: {
          title: "5. Sécurité des données",
          intro: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations personnelles contre tout accès, modification, divulgation ou destruction non autorisés. Ces mesures comprennent le chiffrement des transmissions (SSL/TLS), le hachage sécurisé des mots de passe et des contrôles d'accès restreints. Toutefois, aucune méthode de transmission sur Internet ni de stockage électronique n'est sûre à 100 %, et nous ne pouvons garantir une sécurité absolue.",
        },
        rights: {
          title: "6. Vos droits sur vos données",
          intro: "Vous disposez des droits suivants concernant vos informations personnelles :",
          items: [
            "**Accès :** demander une copie des données personnelles que nous détenons à votre sujet",
            "**Rectification :** demander la correction de données inexactes ou incomplètes",
            "**Suppression :** demander la suppression de vos données personnelles (sous réserve des obligations légales)",
            "**Opposition :** vous désabonner des communications marketing à tout moment",
          ],
        },
        cookies: {
          title: "7. Cookies et données de session",
          intro: "Nous utilisons des cookies et des technologies similaires pour maintenir votre session, mémoriser vos préférences (comme votre langue) et analyser l'utilisation de la plateforme. Les cookies d'authentification vous gardent connecté d'une visite à l'autre. Vous pouvez gérer les cookies dans votre navigateur, mais les désactiver peut affecter le fonctionnement de la plateforme.",
        },
        changes: {
          title: "8. Modifications de cette politique",
          intro: "Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour. Nous vous invitons à la consulter régulièrement pour rester informé de la manière dont nous protégeons vos informations.",
        },
        contact: {
          title: "9. Nous contacter",
          intro: "Pour toute question ou préoccupation concernant cette politique ou nos pratiques en matière de données, contactez-nous :",
        },
      },
    },
    terms: {
      title: "Conditions d'utilisation",
      description: "Conditions générales d'utilisation des services AfrikWholesaler.",
      sections: {
        acceptance: {
          title: "1. Acceptation des conditions",
          intro: "En accédant au site et aux services d'AfrikWholesaler ou en les utilisant, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas tout ou partie de ces conditions, vous ne devez pas utiliser nos services. Ces conditions s'appliquent à tous les visiteurs, utilisateurs et autres personnes qui accèdent à la plateforme ou l'utilisent.",
        },
        account: {
          title: "2. Création de compte",
          intro: "Pour accéder à certaines fonctionnalités de la plateforme, vous devez créer un compte. Vous vous engagez à fournir des informations exactes, à jour et complètes lors de l'inscription et à les tenir à jour. Vous êtes responsable de la sécurité de vos identifiants et de toutes les activités effectuées depuis votre compte.",
        },
        pricing: {
          title: "3. Prix et commandes",
          intro: "Tous les prix affichés sur la plateforme peuvent être modifiés sans préavis. Les prix dégressifs dépendent de la quantité et sont indiqués sur chaque fiche produit. Une demande de devis n'est pas une commande ferme ; seul le devis formel émis par AfrikWholesaler fait foi. Les commandes ne sont confirmées qu'après acceptation et paiement de l'éventuel acompte requis.",
        },
        shipping: {
          title: "4. Limitation de responsabilité liée au transport",
          intro: "**Important :** AfrikWholesaler facilite le sourcing, l'inspection qualité et la coordination logistique pour le compte de l'acheteur. Toutefois, dès qu'une expédition quitte l'entrepôt d'origine, AfrikWholesaler **décline toute responsabilité** pour les problèmes pouvant survenir pendant le transport, notamment :",
          items: [
            "Les retards causés par les transporteurs, la douane, la météo ou un cas de force majeure",
            "La perte, l'endommagement ou le vol des marchandises pendant le transport",
            "Les retards de dédouanement, les retenues ou les confiscations par les autorités du pays de destination",
            "Une adresse de livraison incorrecte ou incomplète fournie par l'acheteur",
            "La défaillance de prestataires logistiques ou de transitaires tiers",
          ],
          outro: "En passant commande, l'acheteur reconnaît ces risques et accepte l'entière responsabilité de l'expédition dès qu'elle quitte le site d'origine. Nous recommandons aux acheteurs de souscrire, s'ils le souhaitent, une assurance transport auprès de leurs propres prestataires.",
        },
        refunds: {
          title: "5. Absence de remboursement",
          intro: "**Toutes les ventes sont définitives.** AfrikWholesaler n'accorde aucun remboursement, retour ou échange, quelles que soient les circonstances, y compris :",
          items: [
            "Les produits endommagés ou perdus pendant le transport",
            "Les retards ou l'absence de livraison dus à la douane ou au transporteur",
            "Un changement d'avis ou une erreur de choix de produit après confirmation de la commande",
            "De légères variations de couleur, de taille ou de spécifications dues à la production en usine",
            "Les commandes annulées après le début de la production ou de l'expédition",
          ],
          outro: "Dans le cas rare où un produit présente un défaut de fabrication constaté par notre équipe d'inspection avant l'expédition, AfrikWholesaler peut, à sa seule discrétion, proposer un remplacement ou un avoir sur une prochaine commande. Ceci ne constitue pas une garantie et est traité au cas par cas.",
        },
        quality: {
          title: "6. Inspection qualité",
          intro: "AfrikWholesaler effectue une inspection qualité de toutes les commandes avant expédition. Cette inspection porte sur les quantités, les défauts visibles et la conformité aux spécifications. Il s'agit d'un service à valeur ajoutée qui ne garantit pas que les produits arriveront dans le même état après le transport, les conditions de transit ne relevant pas de notre responsabilité (voir section 4).",
        },
        ip: {
          title: "7. Propriété intellectuelle",
          intro: "Tous les contenus de la plateforme, y compris les textes, graphismes, logos, images et logiciels, sont la propriété d'AfrikWholesaler ou de ses fournisseurs de contenu et sont protégés par les lois sur la propriété intellectuelle. Toute reproduction, distribution ou création d'œuvre dérivée sans accord écrit préalable est interdite.",
        },
        liability: {
          title: "8. Limitation de responsabilité",
          intro: "AfrikWholesaler ne saurait être tenu responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs résultant de l'utilisation de la plateforme ou des services, y compris la perte de profits, de données ou d'opportunités commerciales. Notre responsabilité totale ne peut excéder le montant que vous avez payé pour la commande à l'origine de la réclamation.",
        },
        law: {
          title: "9. Droit applicable",
          intro: "Les présentes conditions sont régies et interprétées conformément au droit camerounais, sans égard aux règles de conflit de lois. Tout litige relatif à ces conditions relève des tribunaux de Douala, Cameroun.",
        },
        changes: {
          title: "10. Modification des conditions",
          intro: "AfrikWholesaler se réserve le droit de modifier les présentes conditions d'utilisation à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour. La poursuite de l'utilisation de la plateforme après leur publication vaut acceptation des conditions modifiées.",
        },
        contact: {
          title: "11. Nous contacter",
          intro: "Pour toute question sur ces conditions d'utilisation, contactez-nous :",
        },
      },
    },
  },
  es: {
    common: {
      updated: "Última actualización: {date}",
      email: "Correo",
      phone: "Teléfono",
      address: "Dirección",
      addressValue: "Duala, Camerún · Shenzhen, China",
    },
    privacy: {
      title: "Política de privacidad",
      description: "Cómo AfrikWholesaler recopila, usa y protege sus datos.",
      sections: {
        intro: {
          title: "1. Introducción",
          intro: "AfrikWholesaler (\"nosotros\") se compromete a proteger su privacidad. Esta Política de privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza nuestra plataforma y servicios. Léala con atención. Si no está de acuerdo con sus términos, no acceda a la plataforma.",
        },
        collect: {
          title: "2. Información que recopilamos",
          intro: "Podemos recopilar información sobre usted de varias maneras. La información que podemos recopilar incluye:",
          subs: {
            personal: { h: "Datos personales", p: "Información de identificación personal, como su nombre, correo electrónico, teléfono, nombre de la empresa y país, que nos proporciona voluntariamente al registrarse o al enviar una solicitud de cotización." },
            derivative: { h: "Datos técnicos", p: "Información que nuestros servidores recopilan automáticamente cuando accede a la plataforma, como su dirección IP, tipo de navegador, sistema operativo y horas de acceso." },
            financial: { h: "Datos financieros", p: "Información financiera relacionada con sus pedidos, métodos de pago e historial de transacciones. No almacenamos números de tarjeta completos: los pagos se procesan a través de proveedores de pago externos seguros." },
          },
        },
        use: {
          title: "3. Cómo usamos su información",
          intro: "Usamos la información recopilada para:",
          items: [
            "Crear y gestionar su cuenta y brindar atención al cliente",
            "Procesar y completar sus pedidos, solicitudes de cotización y envíos",
            "Enviarle confirmaciones de pedido, actualizaciones de envío y notificaciones del servicio",
            "Mejorar nuestra plataforma, productos y servicios según sus comentarios",
            "Detectar, prevenir y resolver problemas técnicos, fraudes o incidentes de seguridad",
          ],
        },
        sharing: {
          title: "4. Compartir su información",
          intro: "No vendemos, intercambiamos ni transferimos su información personal a terceros sin su consentimiento, salvo en los siguientes casos:",
          items: [
            "Con socios logísticos y transitarios para enviar sus pedidos",
            "Con procesadores de pago para completar las transacciones de forma segura",
            "Cuando lo exija la ley, una orden judicial o una normativa gubernamental",
            "En el marco de una fusión, adquisición o venta de activos",
          ],
        },
        security: {
          title: "5. Seguridad de los datos",
          intro: "Aplicamos medidas técnicas y organizativas adecuadas para proteger su información personal contra accesos, alteraciones, divulgaciones o destrucciones no autorizados. Estas medidas incluyen transmisión cifrada (SSL/TLS), hash seguro de contraseñas y controles de acceso restringidos. Sin embargo, ningún método de transmisión por Internet o de almacenamiento electrónico es 100 % seguro y no podemos garantizar una seguridad absoluta.",
        },
        rights: {
          title: "6. Sus derechos sobre los datos",
          intro: "Usted tiene los siguientes derechos sobre su información personal:",
          items: [
            "**Acceso:** solicitar una copia de los datos personales que tenemos sobre usted",
            "**Rectificación:** solicitar la corrección de datos inexactos o incompletos",
            "**Supresión:** solicitar la eliminación de sus datos personales (sujeto a requisitos legales)",
            "**Oposición:** darse de baja de las comunicaciones de marketing en cualquier momento",
          ],
        },
        cookies: {
          title: "7. Cookies y datos de sesión",
          intro: "Usamos cookies y tecnologías similares para mantener su sesión, recordar sus preferencias (como el idioma) y analizar el uso de la plataforma. Las cookies de autenticación le mantienen conectado entre visitas. Puede gestionar las cookies desde su navegador, pero desactivarlas puede afectar al funcionamiento de la plataforma.",
        },
        changes: {
          title: "8. Cambios en esta política",
          intro: "Nos reservamos el derecho de modificar esta Política de privacidad en cualquier momento. Los cambios se publicarán en esta página con una fecha de revisión actualizada. Le recomendamos consultarla periódicamente para mantenerse informado sobre cómo protegemos su información.",
        },
        contact: {
          title: "9. Contacto",
          intro: "Si tiene preguntas o inquietudes sobre esta Política de privacidad o nuestras prácticas de datos, contáctenos:",
        },
      },
    },
    terms: {
      title: "Términos del servicio",
      description: "Términos y condiciones de uso de los servicios de AfrikWholesaler.",
      sections: {
        acceptance: {
          title: "1. Aceptación de los términos",
          intro: "Al acceder o usar el sitio web y los servicios de AfrikWholesaler, acepta quedar vinculado por estos Términos del servicio. Si no está de acuerdo con alguna parte de estos términos, no debe usar nuestros servicios. Estos términos se aplican a todos los visitantes, usuarios y demás personas que accedan o usen la plataforma.",
        },
        account: {
          title: "2. Registro de cuenta",
          intro: "Para acceder a ciertas funciones de la plataforma, debe registrar una cuenta. Se compromete a proporcionar información exacta, actual y completa durante el registro y a mantenerla actualizada. Usted es responsable de la seguridad de sus credenciales y de todas las actividades realizadas con su cuenta.",
        },
        pricing: {
          title: "3. Precios y pedidos",
          intro: "Todos los precios mostrados en la plataforma pueden cambiar sin previo aviso. Los precios por volumen dependen de la cantidad y se indican en cada página de producto. Las solicitudes de cotización no son pedidos vinculantes; la cotización formal emitida por AfrikWholesaler constituye el precio final. Los pedidos solo se confirman tras la aceptación y el pago del anticipo requerido.",
        },
        shipping: {
          title: "4. Exención de responsabilidad sobre el envío",
          intro: "**Importante:** AfrikWholesaler facilita el abastecimiento, la inspección de calidad y la coordinación logística en nombre del comprador. Sin embargo, una vez que el envío sale del almacén de origen, AfrikWholesaler **declina toda responsabilidad** por los problemas que puedan surgir durante el transporte, incluidos, entre otros:",
          items: [
            "Retrasos causados por transportistas, aduanas, el clima o causas de fuerza mayor",
            "Pérdida, daño o robo de la mercancía durante el tránsito",
            "Retrasos en el despacho aduanero, retenciones o decomisos por parte de las autoridades del país de destino",
            "Direcciones de envío incorrectas o incompletas proporcionadas por el comprador",
            "Fallos de proveedores logísticos o transitarios externos",
          ],
          outro: "Al realizar un pedido, el comprador reconoce estos riesgos y acepta la plena responsabilidad del envío una vez que sale de las instalaciones de origen. Recomendamos a los compradores contratar, si lo desean, un seguro de transporte con sus propios proveedores.",
        },
        refunds: {
          title: "5. Política de no reembolso",
          intro: "**Todas las ventas son definitivas.** AfrikWholesaler no ofrece reembolsos, devoluciones ni cambios en ninguna circunstancia, incluidos:",
          items: [
            "Productos dañados o perdidos durante el envío",
            "Retrasos o falta de entrega por problemas aduaneros o del transportista",
            "Cambio de opinión o selección incorrecta del producto tras la confirmación del pedido",
            "Pequeñas variaciones de color, tamaño o especificaciones propias de la producción en fábrica",
            "Pedidos cancelados después de iniciada la producción o el despacho",
          ],
          outro: "En el caso poco frecuente de que un producto presente un defecto de fabricación verificado por nuestro equipo de inspección antes del despacho, AfrikWholesaler podrá, a su entera discreción, ofrecer un reemplazo o un crédito para un pedido futuro. Esto no constituye una garantía y se gestiona caso por caso.",
        },
        quality: {
          title: "6. Inspección de calidad",
          intro: "AfrikWholesaler realiza una inspección de calidad de todos los pedidos antes del despacho. La inspección abarca el recuento de productos, los defectos visibles y la conformidad con las especificaciones. Es un servicio de valor añadido y no garantiza que los productos lleguen en el mismo estado tras el envío, ya que no somos responsables de las condiciones de tránsito (véase la sección 4).",
        },
        ip: {
          title: "7. Propiedad intelectual",
          intro: "Todo el contenido de esta plataforma, incluidos textos, gráficos, logotipos, imágenes y software, es propiedad de AfrikWholesaler o de sus proveedores de contenido y está protegido por las leyes de propiedad intelectual. No puede reproducir, distribuir ni crear obras derivadas sin consentimiento previo por escrito.",
        },
        liability: {
          title: "8. Limitación de responsabilidad",
          intro: "AfrikWholesaler no será responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso de la plataforma o los servicios, incluida la pérdida de beneficios, datos u oportunidades de negocio. Nuestra responsabilidad total no superará el importe que usted haya pagado por el pedido que origine la reclamación.",
        },
        law: {
          title: "9. Ley aplicable",
          intro: "Estos términos se rigen e interpretan conforme a las leyes de Camerún, sin tener en cuenta sus normas sobre conflicto de leyes. Cualquier controversia derivada de estos términos se resolverá ante los tribunales de Duala, Camerún.",
        },
        changes: {
          title: "10. Cambios en los términos",
          intro: "AfrikWholesaler se reserva el derecho de modificar estos Términos del servicio en cualquier momento. Los cambios se publicarán en esta página con una fecha de revisión actualizada. El uso continuado de la plataforma tras su publicación implica la aceptación de los términos modificados.",
        },
        contact: {
          title: "11. Contacto",
          intro: "Si tiene preguntas sobre estos Términos del servicio, contáctenos:",
        },
      },
    },
  },
  zh: {
    common: {
      updated: "最后更新：{date}",
      email: "邮箱",
      phone: "电话",
      address: "地址",
      addressValue: "喀麦隆杜阿拉 · 中国深圳",
    },
    privacy: {
      title: "隐私政策",
      description: "AfrikWholesaler 如何收集、使用和保护您的数据。",
      sections: {
        intro: {
          title: "1. 引言",
          intro: "AfrikWholesaler（“我们”）致力于保护您的隐私。本隐私政策说明您使用我们的平台和服务时，我们如何收集、使用、披露和保护您的信息。请仔细阅读本政策。如您不同意本政策的条款，请勿访问本平台。",
        },
        collect: {
          title: "2. 我们收集的信息",
          intro: "我们可能通过多种方式收集您的信息，包括：",
          subs: {
            personal: { h: "个人数据", p: "您在注册账户或提交报价申请时自愿提供的可识别个人身份的信息，例如姓名、邮箱、电话号码、公司名称和国家。" },
            derivative: { h: "技术数据", p: "您访问平台时我们的服务器自动收集的信息，例如 IP 地址、浏览器类型、操作系统和访问时间。" },
            financial: { h: "财务数据", p: "与您的订单、支付方式和交易记录相关的财务信息。我们不存储完整的银行卡号——付款由安全的第三方支付服务商处理。" },
          },
        },
        use: {
          title: "3. 我们如何使用您的信息",
          intro: "我们将收集的信息用于：",
          items: [
            "创建和管理您的账户并提供客户支持",
            "处理并履行您的订单、报价申请和货运",
            "向您发送订单确认、物流更新和服务通知",
            "根据您的反馈改进我们的平台、产品和服务",
            "发现、预防和处理技术问题、欺诈或安全事件",
          ],
        },
        sharing: {
          title: "4. 信息共享",
          intro: "未经您的同意，我们不会向第三方出售、交易或以其他方式转让您的个人信息，以下情况除外：",
          items: [
            "与物流合作伙伴和货代共享，以便运送您的订单",
            "与支付服务商共享，以安全完成交易",
            "法律、法院命令或政府法规要求时",
            "涉及企业合并、收购或资产出售时",
          ],
        },
        security: {
          title: "5. 数据安全",
          intro: "我们采取适当的技术和组织措施，保护您的个人信息免遭未经授权的访问、篡改、披露或破坏。这些措施包括加密传输（SSL/TLS）、安全的密码哈希和严格的访问控制。但互联网传输或电子存储方式均无法做到 100% 安全，我们无法保证绝对安全。",
        },
        rights: {
          title: "6. 您的数据权利",
          intro: "您对个人信息享有以下权利：",
          items: [
            "**访问：**索取我们持有的您的个人数据副本",
            "**更正：**要求更正不准确或不完整的数据",
            "**删除：**要求删除您的个人数据（须符合法律要求）",
            "**退订：**随时退订营销信息",
          ],
        },
        cookies: {
          title: "7. Cookie 与会话数据",
          intro: "我们使用 Cookie 及类似技术来维持您的登录会话、记住您的偏好（例如语言）并分析平台使用情况。身份验证 Cookie 用于在多次访问之间保持登录状态。您可以在浏览器中管理 Cookie，但禁用 Cookie 可能影响平台功能。",
        },
        changes: {
          title: "8. 本政策的变更",
          intro: "我们保留随时修改本隐私政策的权利。变更将发布在本页面并更新修订日期。建议您定期查看本页面，了解我们如何保护您的信息。",
        },
        contact: {
          title: "9. 联系我们",
          intro: "如对本隐私政策或我们的数据处理方式有任何疑问，请联系我们：",
        },
      },
    },
    terms: {
      title: "服务条款",
      description: "使用 AfrikWholesaler 服务的条款与条件。",
      sections: {
        acceptance: {
          title: "1. 接受条款",
          intro: "访问或使用 AfrikWholesaler 的网站和服务，即表示您同意受本服务条款约束。如您不同意本条款的任何部分，请勿使用我们的服务。本条款适用于所有访问或使用本平台的访客、用户及其他人员。",
        },
        account: {
          title: "2. 账户注册",
          intro: "使用平台的部分功能需要注册账户。您同意在注册时提供准确、最新和完整的信息，并及时更新。您有责任保管好账户凭据，并对账户下发生的所有活动负责。",
        },
        pricing: {
          title: "3. 价格与订单",
          intro: "平台上显示的所有价格均可能随时变动，恕不另行通知。阶梯价格按数量确定，并在各产品页面注明。报价申请不构成有约束力的订单；以 AfrikWholesaler 出具的正式报价为最终价格。订单仅在确认并支付所需定金后生效。",
        },
        shipping: {
          title: "4. 运输责任免责声明",
          intro: "**重要：**AfrikWholesaler 代表买方提供寻源、质检和物流协调服务。但货物一经从始发仓库发出，AfrikWholesaler 对运输过程中可能出现的问题**不承担任何责任**，包括但不限于：",
          items: [
            "承运商、海关、天气或不可抗力导致的运输延误",
            "运输途中货物的丢失、损坏或被盗",
            "目的国当局导致的清关延误、扣留或没收",
            "买方提供的收货地址错误或不完整",
            "第三方物流服务商或货代的失误",
          ],
          outro: "下单即表示买方知悉上述风险，并在货物离开始发地后承担全部责任。建议买方根据需要通过自己的服务商购买运输保险。",
        },
        refunds: {
          title: "5. 不退款政策",
          intro: "**所有销售均为最终交易。**AfrikWholesaler 在任何情况下均不提供退款、退货或换货，包括：",
          items: [
            "运输途中损坏或丢失的产品",
            "因海关或承运商问题导致的延误或未送达",
            "订单确认后改变主意或选错产品",
            "工厂生产造成的颜色、尺寸或规格的细微差异",
            "生产或发货开始后取消的订单",
          ],
          outro: "如极少数情况下产品存在经我们质检团队在发货前确认的制造缺陷，AfrikWholesaler 可自行决定提供换货或抵扣后续订单的额度。这不构成保证，将视具体情况处理。",
        },
        quality: {
          title: "6. 质量检验",
          intro: "AfrikWholesaler 在发货前对所有订单进行质量检验，检验内容包括产品数量、可见缺陷和规格是否相符。质检是一项增值服务，不保证产品在运输后保持相同状态，因为我们不对运输条件负责（见第 4 条）。",
        },
        ip: {
          title: "7. 知识产权",
          intro: "本平台上的所有内容，包括文字、图形、标志、图片和软件，均为 AfrikWholesaler 或其内容供应商的财产，受知识产权法保护。未经事先书面同意，不得复制、分发或基于任何内容创作衍生作品。",
        },
        liability: {
          title: "8. 责任限制",
          intro: "对于因使用本平台或服务而产生的任何间接、附带、特殊、后果性或惩罚性损害，包括但不限于利润、数据或商业机会的损失，AfrikWholesaler 概不负责。我们的总责任不超过您为引起索赔的该笔订单所支付的金额。",
        },
        law: {
          title: "9. 适用法律",
          intro: "本条款受喀麦隆法律管辖并据其解释，不考虑其法律冲突规则。因本条款产生的任何争议应由喀麦隆杜阿拉的法院解决。",
        },
        changes: {
          title: "10. 条款变更",
          intro: "AfrikWholesaler 保留随时修改本服务条款的权利。变更将发布在本页面并更新修订日期。变更发布后继续使用平台即表示接受修改后的条款。",
        },
        contact: {
          title: "11. 联系我们",
          intro: "如对本服务条款有任何疑问，请联系我们：",
        },
      },
    },
  },
});
