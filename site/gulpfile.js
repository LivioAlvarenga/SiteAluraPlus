const gulp = require("gulp");
const fs = require("fs");

// Variáveis que determina o fluxo de build e dist. Default build
let dir = "build/";
let url = "https://produtivese.vercel.app/";
let ext = ".html";

// Função que troca as variáveis
function distOn() {
    dir = "dist/";
    url = "https://produtivese.com.br/";
    ext = "";
}

// Usando gulp-load-plugins para carregar todos os plugins
const $ = require("gulp-load-plugins")({ rename: { "gulp-uglify": "uglify" } });

// Apagando a pasta build/dist
gulp.task("clean", function () {
    return gulp.src(dir, { read: false, allowEmpty: true }).pipe($.clean());
});
// Apagando a pasta assets/css/base
gulp.task("clean-css-pages", function () {
    return gulp
        .src(`${dir}assets/css/pages/`, { read: false, allowEmpty: true })
        .pipe($.clean());
});

//Copiando arquivos
gulp.task("copy-font", function () {
    return gulp.src(["site/assets/fonts/**/*"]).pipe(gulp.dest(`${dir}assets/fonts/`));
});
gulp.task("copy-robots", function () {
    return gulp.src(["site/robots.txt", "site/.htaccess"]).pipe(gulp.dest(`${dir}`));
});

/* Imagens */
gulp.task("imagemin", function () {
    return gulp
        .src("site/assets/img/**/*")
        .pipe(
            $.imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }, { cleanupIDs: false }],
            })
        )
        .pipe(gulp.dest(`${dir}assets/img/`));
});

// Minificação JS, add suffix .min
gulp.task("minify-js", function () {
    return gulp
        .src("js/**/*.js")
        .pipe($.uglify())
        .pipe($.rename({ suffix: ".min" }))
        .pipe(gulp.dest(`${dir}js/`));
});

//Minificação CSS, add suffix .min
gulp.task("minify-css", function () {
    return gulp
        .src(["site/assets/css/components/*.css", "site/assets/css/pages/*.css"])
        .pipe($.cssnano({ safe: true }))
        .pipe($.rename({ suffix: ".min" }))
        .pipe(gulp.dest(`${dir}assets/css/`));
});

//Minificação HTML
gulp.task("minify-html", function () {
    return gulp
        .src(["site/*.html"])
        .pipe($.htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(`${dir}`));
});

// Concatenação useref
gulp.task("useref", function () {
    return gulp
        .src(`${dir}*.html`)
        .pipe($.useref())
        .pipe(gulp.dest(`${dir}`));
});

// Adicionar código inline no html
gulp.task("inline", function () {
    return gulp
        .src("./site/*.html")
        .pipe($.inlineSource())
        .pipe(gulp.dest(`${dir}`));
});

// Concatenação, inline e minificação
gulp.task("concatena-inline-minifica", function () {
    return gulp
        .src([
            "site/index.html",
            "site/termo-de-uso.html",
            "site/politica-privacidade.html",
        ])
        .pipe($.if("index.html", $.replace("/style.css", "/home.css")))
        .pipe(
            $.if(
                "politica-privacidade.html",
                $.replace("/style.css", "/politica-privacidade.css")
            )
        )
        .pipe($.if("termo-de-uso.html", $.replace("/style.css", "/termo-de-uso.css")))
        .pipe($.useref())
        .pipe($.if("*.html", $.inlineSource()))
        .pipe($.if("*.html", $.htmlmin({ collapseWhitespace: true })))
        .pipe($.if("*.js", $.uglify()))
        .pipe($.if("*.css", $.cssnano({ safe: true })))
        .pipe(gulp.dest(`${dir}`));
});

// gera sitemap sem imagens
gulp.task("sitemap", function () {
    return gulp
        .src(`${dir}*.html`, {
            read: false,
        })
        .pipe(
            $.sitemap({
                siteUrl: `${url}`,
                images: false,
            })
        )
        .pipe(gulp.dest(`${dir}`));
});

// troca os .html por endereço do site
gulp.task("replace-html-build", function () {
    return gulp
        .src([`${dir}**/*.html`])
        .pipe($.replace("index.html", `${url}`))
        .pipe($.replace("termo-de-uso.html", `${url}termo-de-uso${ext}`))
        .pipe($.replace("politica-privacidade.html", `${url}politica-privacidade${ext}`))
        .pipe(gulp.dest(`${dir}`));
});

// O sitemap.xml é gerado com .html substituímos para o link ficar sem .html
gulp.task("replace-sitemap", function () {
    return gulp
        .src([`${dir}sitemap.xml`])
        .pipe($.replace(".html", ""))
        .pipe(gulp.dest(`${dir}`));
});

// Substituir o caminho das fontes após o build
gulp.task("replace-font", function () {
    return gulp
        .src(`${dir}assets/css/*.css`)
        .pipe($.replace("../../fonts/", "../fonts/"))
        .pipe(gulp.dest(`${dir}assets/css/`));
});

/*
Modificando tailwindContent.json para monitorar tudo, ambiente de desenvolvimento!
Tailwind joga todo css em style.css e todos .html ler o mesmo. Quando fazer o build
separa tudo para otimização, criando css somente do que for usar.
*/
let contentAll = {
    tudo: 'content: ["./site/index.html", "./site/termo-de-uso.html", "./site/politica-privacidade.html", "./site/js/navbar.js"],',
    home: 'content: ["./site/index.html", "./site/js/navbar.js"],',
    politica: 'content: ["./site/politica-privacidade.html", "./site/js/navbar.js"],',
    termo: 'content: ["./site/termo-de-uso.html", "./site/js/navbar.js"],',
};

gulp.task("monitoraTudo", function () {
    return gulp
        .src("./tailwind.config.js")
        .pipe($.replace(/content.\s\[[^\][]*],/g, contentAll.tudo))
        .pipe($.clean())
        .pipe(gulp.dest("./"));
});
gulp.task(
    "startTailwindDev",
    $.shell.task(
        "npx tailwindcss -i ./site/assets/css/base/input.css -o ./site/assets/css/pages/style.css --watch"
    )
);

gulp.task("monitoraHome", function () {
    return gulp
        .src("./tailwind.config.js")
        .pipe($.replace(/content.\s\[[^\][]*],/g, contentAll.home))
        .pipe($.clean())
        .pipe(gulp.dest("./"));
});
gulp.task(
    "criaCssHome",
    $.shell.task(
        "npx tailwindcss -i ./site/assets/css/base/input.css -o ./site/assets/css/pages/home.css"
    )
);
gulp.task("monitoraTermoUso", function () {
    return gulp
        .src("./tailwind.config.js")
        .pipe($.replace(/content.\s\[[^\][]*],/g, contentAll.termo))
        .pipe($.clean())
        .pipe(gulp.dest("./"));
});
gulp.task(
    "criaCssTermoUso",
    $.shell.task(
        "npx tailwindcss -i ./site/assets/css/base/input.css -o ./site/assets/css/pages/termo-de-uso.css"
    )
);
gulp.task("monitoraPoliticaPrivacidade", function () {
    return gulp
        .src("./tailwind.config.js")
        .pipe($.replace(/content.\s\[[^\][]*],/g, contentAll.politica))
        .pipe($.clean())
        .pipe(gulp.dest("./"));
});
gulp.task(
    "criaCssPoliticaPrivacidade",
    $.shell.task(
        "npx tailwindcss -i ./site/assets/css/base/input.css -o ./site/assets/css/pages/politica-privacidade.css"
    )
);

gulp.task(
    "separaCss",
    gulp.series(
        "monitoraHome",
        "criaCssHome",
        "monitoraTermoUso",
        "criaCssTermoUso",
        "monitoraPoliticaPrivacidade",
        "criaCssPoliticaPrivacidade"
    )
);

// Habilita variáveis em condição de dist
gulp.task("distOn", function (callback) {
    distOn();
    callback();
});

// Ligando o Tailwind para monitorar tudo (ambiente DEV)
gulp.task("start", gulp.series("monitoraTudo", "startTailwindDev"));

gulp.task(
    "default",
    gulp.series(
        "clean",
        gulp.parallel("copy-font", "copy-robots"),
        "imagemin",
        "separaCss",
        "concatena-inline-minifica",
        "replace-html-build",
        "replace-font",
        "sitemap",
        "replace-sitemap",
        "clean-css-pages"
    )
);

gulp.task(
    "dist",
    gulp.series(
        "distOn",
        "clean",
        gulp.parallel("copy-font", "copy-robots"),
        "imagemin",
        "separaCss",
        "concatena-inline-minifica",
        "replace-html-build",
        "replace-font",
        "sitemap",
        "replace-sitemap",
        "clean-css-pages"
    )
);
