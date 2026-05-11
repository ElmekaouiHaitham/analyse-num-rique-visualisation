import NewtonVisualizer from "@/components/NewtonVisualizer";
import "./page.css";

export default function Home() {
  return (
    <main className="container">
      <div className="hero-section" style={{ padding: "2rem 1rem", alignItems: "flex-start", textAlign: "left" }}>
        <h1 className="hero-title text-accent" style={{ fontSize: "3rem", marginBottom: "2rem" }}>
          Méthode de Newton-Raphson
        </h1>
        
        <div className="remarque-box" style={{ width: "100%" }}>
          <h3>Introduction</h3>
          <p>
            La méthode de Newton-Raphson est un algorithme efficace pour trouver numériquement une bonne approximation de la racine (ou zéro) d'une fonction réelle.
          </p>
        </div>

        <div className="theoreme-box" style={{ width: "100%" }}>
          <h2>Théorème (Convergence de la méthode)</h2>
          <p>
            Soit $f(x)$ une fonction continûment dérivable. En partant d'une approximation initiale $x_0$, la suite définie par la relation de récurrence :
          </p>
          <div style={{ textAlign: "center", margin: "1rem 0", fontSize: "1.2rem", fontWeight: "bold" }}>
            {"$x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}$"}
          </div>
          <p>
            converge vers la racine de l'équation $f(x) = 0$ sous certaines conditions de régularité (notamment $f'(r) \neq 0$). Géométriquement, cela correspond à tracer la tangente à la courbe au point $(x_n, f(x_n))$ et à prendre l'intersection avec l'axe des abscisses pour le point suivant.
          </p>
        </div>
      </div>

      <div className="tool-section">
        <NewtonVisualizer />
      </div>
      
      <footer className="footer">
        <p>© {new Date().getFullYear()} Analyse Numérique. Visualisation interactive.</p>
      </footer>
    </main>
  );
}
