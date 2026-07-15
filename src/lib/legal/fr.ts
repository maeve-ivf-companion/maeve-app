// French mirror of en.ts. Typed as LegalContent so TypeScript enforces the same
// shape. See the note at the top of en.ts: draft pending legal review.

import type { LegalContent } from "./en";

export const legalFr: LegalContent = {
  terms: {
    title: "Conditions d'utilisation",
    updated: "Dernière mise à jour : 15 juillet 2026",
    draftNotice:
      "Ceci est une ébauche en attente de révision juridique. Elle décrit le fonctionnement actuel de Maeve et ne constitue pas encore une entente définitive.",
    intro:
      "Maeve est une application compagnon pour la FIV, créée par Maman Biomedical Inc. Ces conditions expliquent ce qu'est Maeve, ce qu'elle n'est pas, et ce à quoi nous nous engageons mutuellement. Veuillez lire attentivement la section sur les avis médicaux. C'est la plus importante.",
    sections: [
      {
        heading: "Maeve ne donne pas d'avis médical",
        body: [
          "Maeve est un outil d'information et de soutien émotionnel. Ce n'est pas un dispositif médical, ce n'est pas une clinique, et elle ne pratique pas la médecine. Rien dans Maeve ne constitue un diagnostic, une ordonnance ou une consigne de traitement.",
          "Votre clinique de fertilité est la seule référence pour vos soins. Ne modifiez jamais une dose, un horaire ou une décision en vous fondant sur ce que Maeve vous a dit. Si quelque chose vous semble urgent ou anormal, communiquez immédiatement avec votre clinique ou consultez un médecin. N'attendez pas, et n'utilisez pas Maeve à la place.",
          "Ce que Maeve vous montre au sujet de vos résultats hormonaux est une explication en langage simple de tendances générales, et non une évaluation de votre corps ou de votre cycle.",
        ],
      },
      {
        heading: "À propos des fonctions d'IA",
        body: [
          "Certaines parties de Maeve utilisent l'intelligence artificielle, plus précisément Claude, créé par Anthropic. Il s'agit du résumé pour le ou la partenaire, de l'explication en langage simple des saisies hormonales, et des réponses « et si » dans la section Apprendre.",
          "L'IA peut se tromper. Elle peut se tromper avec assurance. Considérez tout ce qu'elle dit comme un point de départ pour une conversation avec votre clinique, jamais comme une réponse.",
          "Pour offrir ces fonctions, le contenu pertinent que vous saisissez est transmis à Anthropic afin de générer une réponse. Consultez notre Politique de confidentialité pour savoir ce que cela implique pour vos données.",
        ],
      },
      {
        heading: "Qui peut utiliser Maeve",
        body: [
          "Vous devez avoir au moins 18 ans pour créer un compte.",
          "Vous êtes responsable de votre compte et de la confidentialité de votre mot de passe. Avisez-nous rapidement si vous croyez qu'une autre personne y a accès.",
        ],
      },
      {
        heading: "Votre partenaire et ce qu'il ou elle voit",
        body: [
          "Si vous connectez un ou une partenaire à l'aide d'un code d'invitation, vous contrôlez ce qu'il ou elle voit. Par défaut, votre partenaire voit le résumé émotionnel que vous choisissez d'envoyer, et rien d'autre.",
          "Vos résultats hormonaux ne sont jamais partagés avec votre partenaire, quel que soit le niveau de partage.",
          "Vous pouvez modifier votre niveau de partage ou déconnecter un ou une partenaire à tout moment depuis votre compte.",
        ],
      },
      {
        heading: "Les portails communautaires",
        body: [
          "Les publications que vous marquez comme communautaires sont visibles par les autres personnes qui utilisent Maeve. Celles que vous marquez comme privées ne le sont pas.",
          "Veuillez ne rien publier qui identifie une autre personne, ni de contenu abusif, harcelant, ou présenté comme un avis médical destiné à autrui. Nous pouvons retirer les publications ou les comptes qui le font.",
          "Réfléchissez avant de publier dans la communauté. D'autres personnes qui vivent la FIV vous liront.",
        ],
      },
      {
        heading: "Votre contenu vous appartient",
        body: [
          "Ce que vous écrivez et consignez dans Maeve vous appartient. Nous n'en revendiquons pas la propriété.",
          "Vous nous autorisez à le stocker et à le traiter uniquement dans la mesure nécessaire au fonctionnement des fonctions que vous utilisez, comme le décrit la Politique de confidentialité.",
        ],
      },
      {
        heading: "Mettre fin à votre compte",
        body: [
          "Vous pouvez supprimer vos données à tout moment depuis l'onglet Compte. La suppression est permanente et nous ne pouvons pas les récupérer par la suite.",
          "Nous pouvons suspendre ou fermer un compte qui enfreint ces conditions ou met d'autres personnes en danger.",
        ],
      },
      {
        heading: "Disponibilité et limites",
        body: [
          "Maeve est fournie telle quelle. Nous ne garantissons pas qu'elle sera toujours disponible, sans erreur ou sans interruption, et il s'agit d'un produit à un stade précoce.",
          "Dans toute la mesure permise par la loi, Maman Biomedical Inc. n'est pas responsable des pertes indirectes ou consécutives découlant de votre utilisation de Maeve. Rien dans ces conditions ne limite une responsabilité qui ne peut légalement être limitée.",
        ],
      },
      {
        heading: "Modifications et droit applicable",
        body: [
          "Nous pouvons mettre à jour ces conditions à mesure que Maeve évolue. Si un changement est important, nous vous en informerons dans l'application avant son entrée en vigueur.",
          "Ces conditions sont régies par les lois de la province de la Nouvelle-Écosse et par les lois du Canada qui s'y appliquent.",
        ],
      },
    ],
    contact:
      "Des questions sur ces conditions ? Communiquez avec Maman Biomedical Inc. à latchmi@mamanbiomedical.ca.",
  },
  privacy: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 15 juillet 2026",
    draftNotice:
      "Ceci est une ébauche en attente de révision juridique. Elle décrit la façon dont Maeve traite les données aujourd'hui et ne constitue pas encore une politique définitive.",
    intro:
      "Maeve détient des renseignements parmi les plus sensibles qui soient : où vous en êtes dans votre traitement de fertilité, et comment vous le vivez. Cette politique explique exactement ce que nous recueillons, pourquoi, qui peut le voir, et comment le récupérer ou le supprimer. Notre règle directrice est le minimum de données viable. Nous ne demandons quelque chose que lorsqu'une fonction que vous utilisez en a réellement besoin.",
    sections: [
      {
        heading: "Ce que nous recueillons",
        body: [
          "Détails du compte : votre adresse courriel et un mot de passe que vous choisissez. Si vous vous connectez avec un lien magique, nous ne stockons aucun mot de passe.",
          "Profil : votre nom d'affichage, votre langue, si vous êtes la patiente ou le ou la partenaire, et facultativement la date de début de votre cycle.",
          "Ce que vous choisissez de consigner : résultats hormonaux, rendez-vous et injections planifiés, publications dans les portails, et questions posées à la section Apprendre.",
          "Registres de consentement : ce que vous avez accepté et quand, y compris si vous avez consenti à recevoir des messages de Maman Biomedical.",
          "Nous ne recueillons pas d'identifiants publicitaires et nous ne vous suivons pas sur d'autres sites Web.",
        ],
      },
      {
        heading: "Renseignements sur la santé",
        body: [
          "Les résultats hormonaux et tout ce que vous écrivez au sujet de votre traitement sont des renseignements personnels sensibles sur la santé, et nous les traitons comme tels.",
          "Vos résultats hormonaux ne sont visibles que par vous. Ils ne sont jamais montrés à un ou une partenaire connecté, quel que soit le niveau de partage, ni aux autres personnes qui utilisent Maeve.",
        ],
      },
      {
        heading: "Ce que votre partenaire peut voir",
        body: [
          "Si vous connectez un ou une partenaire, il ou elle voit les résumés émotionnels que vous envoyez. Il s'agit d'un court résumé rédigé à partir d'une humeur et d'une note facultative que vous avez choisi de partager.",
          "Il ou elle ne voit pas vos résultats hormonaux. Selon le niveau de partage que vous choisissez, votre horaire peut être visible. Vous choisissez ce niveau et pouvez le modifier à tout moment.",
          "Rien n'est partagé avec un ou une partenaire tant que vous n'en connectez pas un à l'aide de votre code d'invitation.",
        ],
      },
      {
        heading: "Traitement par l'IA",
        body: [
          "Trois fonctions utilisent Claude, un service d'IA d'Anthropic : le résumé pour le ou la partenaire, l'interprétation hormonale, et les réponses « et si » de la section Apprendre.",
          "Lorsque vous utilisez l'une de ces fonctions, le contenu pertinent est transmis à Anthropic pour générer une réponse. Cela signifie une humeur et une note pour un résumé, une valeur hormonale pour une interprétation, ou votre question pour un « et si ».",
          "Nous ne transmettons pas votre adresse courriel ni votre nom à Anthropic dans le cadre de ces demandes.",
          "Si vous préférez que votre contenu ne soit pas traité ainsi, n'utilisez pas ces trois fonctions. Le reste de Maeve fonctionne sans elles.",
        ],
      },
      {
        heading: "Où vos données sont hébergées",
        body: [
          "Vos données sont stockées dans une base de données Postgres hébergée par Supabase, protégée par des règles de sécurité au niveau des lignes afin qu'un compte ne puisse pas lire les données d'un autre compte.",
          "L'application est hébergée sur Vercel.",
          "Ces fournisseurs stockent les données sur des serveurs qui peuvent se trouver à l'extérieur du Canada. Elles peuvent donc être assujetties aux lois du pays où elles sont stockées.",
        ],
      },
      {
        heading: "Les messages que nous envoyons",
        body: [
          "Nous envoyons les courriels nécessaires au fonctionnement de votre compte, comme la confirmation de votre adresse ou la réinitialisation de votre mot de passe. Ce ne sont pas des messages promotionnels.",
          "Nous n'envoyons des messages promotionnels de Maman Biomedical que si vous y avez expressément consenti. Cette case n'est jamais cochée pour vous, et ne pas la cocher ne limite en rien votre utilisation de Maeve.",
          "Vous pouvez retirer ce consentement à tout moment, et chaque message promotionnel comprend un moyen de vous désabonner.",
        ],
      },
      {
        heading: "Vos droits",
        body: [
          "Vous pouvez consulter et exporter tout ce que nous détenons à votre sujet depuis l'onglet Compte, avec la fonction de téléchargement de vos données.",
          "Vous pouvez supprimer vos données depuis l'onglet Compte. La suppression est permanente.",
          "Vous pouvez corriger les détails de votre profil à tout moment.",
          "En vertu des lois canadiennes sur la protection de la vie privée, dont la LPRPDE, vous avez le droit d'accéder à vos renseignements personnels et d'en contester l'exactitude. Communiquez avec nous si vous souhaitez exercer ces droits et ne pouvez pas le faire dans l'application.",
        ],
      },
      {
        heading: "Durée de conservation",
        body: [
          "Nous conservons vos données tant que votre compte existe. Lorsque vous supprimez vos données, elles sont retirées de la base de données active.",
          "Nous conservons les registres de consentement aussi longtemps que nécessaire pour démontrer que nous avions la permission de vous joindre, ce qui est une exigence légale.",
        ],
      },
      {
        heading: "Enfants",
        body: [
          "Maeve ne s'adresse pas aux personnes de moins de 18 ans et nous ne recueillons pas sciemment de renseignements auprès d'enfants.",
        ],
      },
      {
        heading: "Modifications de cette politique",
        body: [
          "Si nous modifions la façon dont nous traitons vos données d'une manière qui vous concerne, nous vous en informerons dans l'application avant l'entrée en vigueur du changement, et nous demanderons un nouveau consentement lorsque la loi l'exige.",
        ],
      },
    ],
    contact:
      "Des questions, ou vous souhaitez exercer un droit relatif à la vie privée ? Communiquez avec Maman Biomedical Inc. à latchmi@mamanbiomedical.ca.",
  },
};
