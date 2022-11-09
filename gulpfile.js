const gulp = require("gulp");
const fs = require("fs");

// Variáveis que determina o fluxo de build e dist. Default build
let dir = "build/";
let url = "https://aluraplus-hazel-iota.vercel.app/";
let ext = ".html";

// Função que troca as variáveis
function distOn() {
    dir = "dist/";
    url = "https://aluraplus.com.br/";
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

// Concatenação, inline e minificação
gulp.task("concatena-inline-minifica", function () {
    return gulp
        .src(["site/index.html"])
        .pipe($.if("index.html", $.replace("/style.css", "/home.css")))
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
    tudo: 'content: ["./site/index.html"],',
    home: 'content: ["./site/index.html"],',
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
        "npx tailwindcss -i ./site/assets/css/base/global.css -o ./site/assets/css/pages/style.css --watch"
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
        "npx tailwindcss -i ./site/assets/css/base/global.css -o ./site/assets/css/pages/home.css"
    )
);

gulp.task("separaCss", gulp.series("monitoraHome", "criaCssHome"));

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
