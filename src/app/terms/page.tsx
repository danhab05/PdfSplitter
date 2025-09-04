import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-4xl space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Conditions d'utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>Dernière mise à jour : 4 septembre 2025</p>
            
            <p>
              Bienvenue sur Diviseur de PDF. En accédant ou en utilisant notre service, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'êtes pas d'accord avec une partie des conditions, vous ne pouvez pas accéder au service.
            </p>

            <h3 className="text-xl font-semibold text-foreground">1. Utilisation du Service</h3>
            <p>
              Notre service vous permet de télécharger, traiter et diviser des fichiers PDF. Vous êtes seul responsable des fichiers que vous téléchargez. Vous vous engagez à ne pas utiliser le service à des fins illégales ou interdites par les présentes conditions. Vous ne devez pas télécharger de contenu protégé par des droits d'auteur sans l'autorisation du propriétaire, ni de contenu malveillant, diffamatoire ou illicite.
            </p>

            <h3 className="text-xl font-semibold text-foreground">2. Confidentialité et Sécurité</h3>
            <p>
              Nous prenons la confidentialité de vos données au sérieux. Les fichiers que vous téléchargez sont traités sur nos serveurs uniquement dans le but de réaliser l'opération de division demandée. Nous ne stockons, ne partageons et n'analysons pas vos fichiers au-delà de ce qui est nécessaire au fonctionnement du service. Les fichiers sont automatiquement supprimés de nos serveurs après une courte période.
            </p>

            <h3 className="text-xl font-semibold text-foreground">3. Propriété Intellectuelle</h3>
            <p>
              Le service et son contenu original (à l'exclusion du contenu fourni par les utilisateurs), ses caractéristiques et ses fonctionnalités sont et resteront la propriété exclusive de Habib Dan et de ses concédants de licence.
            </p>

            <h3 className="text-xl font-semibold text-foreground">4. Limitation de Responsabilité</h3>
            <p>
              Le service est fourni "TEL QUEL" et "TEL QUE DISPONIBLE". En aucun cas, Habib Dan ne pourra être tenu responsable de tout dommage indirect, accidentel, spécial, consécutif ou punitif résultant de votre accès ou de votre utilisation du service. Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou exempt d'erreurs.
            </p>

            <h3 className="text-xl font-semibold text-foreground">5. Modifications</h3>
            <p>
              Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces conditions à tout moment. Nous nous efforcerons de fournir un préavis d'au moins 30 jours avant l'entrée en vigueur de toute nouvelle condition.
            </p>

            <h3 className="text-xl font-semibold text-foreground">6. Contact</h3>
            <p>
              Si vous avez des questions concernant ces conditions, veuillez nous contacter.
            </p>
          </CardContent>
        </Card>
        <div className="text-center">
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
                </Link>
            </Button>
        </div>
      </main>
    </div>
  );
}
