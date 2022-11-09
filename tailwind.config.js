/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./site/index.html"],
    theme: {
        extend: {
            backgroundImage: {
                banner: "url(../../img/Background.png)",
            },
            colors: {
                brancoPrincipal: "#ffffff",
                cinzaSecundario: "#C0C0C0",
                botaoAzul: "#167BF7",
                corDeFundo: "#00030C",
                botaoAzulEfeito: "#3c92fa",
            },
        },
        fontFamily: {
            inter: ["Inter", "sans-serif"],
        },
    },
    plugins: [],
};
