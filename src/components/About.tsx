import { Award, Users, Clock, Shield } from "lucide-react";

const stats = [
  { icon: Users, value: "500+", label: "Clients Satisfaits" },
  { icon: Clock, value: "24/7", label: "Service Disponible" },
  { icon: Award, value: "5+", label: "Années d'Expérience" },
  { icon: Shield, value: "100%", label: "Garantie Qualité" }
];

export const About = () => {
  return (
    <section id="apropos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <p className="text-accent font-semibold uppercase tracking-wider">À propos de la société</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Entreprise de nettoyage de confiance depuis 2020
            </h2>
            <div className="space-y-4 text-muted-foreground text-lg">
              <p>
                Bienvenue chez <strong className="text-foreground">LaFriend's Services Ménagers</strong>, 
                votre partenaire de confiance pour des services de nettoyage professionnels. 
                Que vous ayez besoin d'un nettoyage résidentiel, d'un entretien de bureaux ou 
                d'un lavage de voiture, notre équipe d'experts est là pour vous offrir une propreté impeccable.
              </p>
              <p>
                Grâce à notre plateforme en ligne innovante, réserver un service de nettoyage 
                n'a jamais été aussi simple. Nos produits écologiques et nos techniques de 
                pointe garantissent un résultat optimal tout en respectant l'environnement.
              </p>
              <p>
                Faites confiance à LaFriend's pour transformer votre espace et vous offrir 
                un cadre de vie sain et agréable. Découvrez dès maintenant la différence 
                LaFriend's et profitez d'un service de qualité à des prix compétitifs.
              </p>
            </div>
          </div>

          {/* Right content - Stats */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-primary text-primary-foreground p-8 rounded-lg text-center hover:bg-primary/90 transition-colors duration-300"
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-accent" />
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
