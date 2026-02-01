// Arquivo: server.js (completo)
const session = require("express-session");
const express = require("express");
const path = require("path");
const { Amigo, Jogo, Emprestimo } = require("./models");
const app = express();
const PORT = 3001;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "segredo-do-ifpi",
    resave: false,
    saveUninitialized: true
}));
app.get("/", (req, res) => res.redirect("/login"));

// LOGIN

app.get("/login", (req, res) => res.render("login", { erro: null }));

function verificarAutenticacao(req, res, next) {
    if (req.session.usuarioLogado) {
        return next(); // Se estiver logado, prossegue
    }
    res.redirect("/login"); // Se não, volta para o login
}

// rota de POST Login para salvar a sessão
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    const usuario = await Amigo.findOne({ where: { email } });

    if (usuario && senha === "123") {
        req.session.usuarioLogado = true; // Salva que o usuário entrou
        return res.redirect("/amigos");
    }
    res.render("login", { erro: "E-mail ou senha incorretos!" });
});

// Proteja as rotas usando a função
app.get("/amigos", verificarAutenticacao, async (req, res) => {
    const amigos = await Amigo.findAll({ order: [["id", "ASC"]] });
    res.render("amigos/index", { amigos });
});

app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    const usuario = await Amigo.findOne({ where: { email } });

    // Simulação de login simples para o trabalho
    if (usuario && senha === "123") { // Você pode definir uma senha padrão
        return res.redirect("/amigos");
    }
    res.render("login", { erro: "E-mail ou senha incorretos!" });
});

// DETALHAMENTO

app.get("/amigos/detalhes/:id", async (req, res) => {
    try {
        const amigo = await Amigo.findByPk(req.params.id, {
            include: [{ model: Jogo, as: "jogos" }] // Agora o codnome 'jogos' existe!
        });

        if (!amigo) return res.status(404).send("Amigo não encontrado.");

        res.render("amigos/detalhes", { amigo });
    } catch (error) {
        console.log(error); // Isso ajuda a ver o erro no terminal se algo falhar
        res.status(500).send("Erro ao carregar detalhes.");
    }
});

app.get("/jogos/detalhes/:id", verificarAutenticacao, async (req, res) => {
    const jogo = await Jogo.findByPk(req.params.id, {
        include: [{ model: Amigo, as: "dono" }, { model: Emprestimo, as: "emprestimos" }]
    });
    res.render("jogos/detalhes", { jogo });
});

// AMIGOS
app.get("/amigos", async (req, res) => {
    const amigos = await Amigo.findAll({ order: [["id", "ASC"]] });
    res.render("amigos/index", { amigos });
});

// Rota para o serviço REST de Amigos
app.get("/api/amigos", async (req, res) => {
    try {
        const amigos = await Amigo.findAll({ order: [["id", "ASC"]] });
        res.json(amigos); // Devolve apenas o JSON bruto
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados." });
    }
});

app.get("/amigos/novo", (req, res) => res.render("amigos/novo"));

app.get("/amigos/detalhes/:id", async (req, res) => {
    const amigo = await Amigo.findByPk(req.params.id, {
        // Inclui os jogos que esse amigo possui para mostrar "informações completas" 
        include: [{ model: Jogo, as: "jogos" }] 
    });

    if (!amigo) return res.status(404).send("Amigo não encontrado.");
    
    res.render("amigos/detalhes", { amigo });
});

app.get("/amigos/editar/:id", async (req, res) => {
    const amigo = await Amigo.findByPk(req.params.id);
    if (!amigo) return res.status(404).send("Amigo não encontrado.");
    res.render("amigos/editar", { amigo });
});

app.post("/amigos/novo", async (req, res) => {
    const { nome, email } = req.body;
    await Amigo.create({ nome, email });
    res.redirect("/amigos");
});

app.post("/amigos/editar/:id", async (req, res) => {
    const { nome, email } = req.body;
    await Amigo.update({ nome, email }, { where: { id: req.params.id } });
    res.redirect("/amigos");
});

app.post("/amigos/excluir/:id", async (req, res) => {
    await Amigo.destroy({ where: { id: req.params.id } });
    res.redirect("/amigos");
});



// JOGOS
app.get("/jogos", async (req, res) => {
    const jogos = await Jogo.findAll({
        include: [{ model: Amigo, as: "dono" }],
        order: [["id", "ASC"]],
    });
    res.render("jogos/index", { jogos });
});

// API para Jogos
app.get("/api/jogos", verificarAutenticacao, async (req, res) => {
    const jogos = await Jogo.findAll({ include: [{ model: Amigo, as: "dono" }] });
    res.json(jogos);
});

// REST jogos
app.get("/api/jogos", async (req, res) => {
        const jogos = await Jogo.findAll({
            include: [{ model: Amigo, as: "dono" }],
            order: [["id", "ASC"]],
        });
        res.json(jogos); 
});

app.get("/jogos/novo", async (req, res) => {
    const amigos = await Amigo.findAll({ order: [["nome", "ASC"]] });
    res.render("jogos/novo", { amigos });
});

app.post("/jogos/novo", async (req, res) => {
    const { titulo, plataforma, amigoId } = req.body;

    // Lógica para evitar repetidos 
    const jogoExistente = await Jogo.findOne({ 
        where: { 
            titulo: titulo,
            plataforma: plataforma 
        } 
    });

if (jogoExistente) {
    return res.status(400).send(`
        <body style="background-color: #000; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif;">
            <div style="background-color: #121212; border: 2px solid #7c4dff; padding: 30px; border-radius: 12px; box-shadow: 0 0 20px rgba(124, 77, 255, 0.3); max-width: 400px; text-align: center;">
                <h2 style="color: #ff5252; margin-top: 0;">⚠️ Jogo Duplicado</h2>
                <textarea readonly style="width: 100%; height: 80px; background: #222; color: #eee; border: 1px solid #444; border-radius: 5px; padding: 10px; resize: none; font-family: monospace; margin-bottom: 20px;">ERRO: O título "${titulo}" já consta no sistema para a plataforma "${plataforma}".</textarea>
                <a href="/jogos/novo" style="background-color: #7c4dff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">VOLTAR</a>
            </div>
        </body>
    `);
}

    await Jogo.create({ titulo, plataforma, amigoId: Number(amigoId) });
    res.redirect("/jogos");
});

app.get("/jogos/editar/:id", async (req, res) => {
    const jogo = await Jogo.findByPk(req.params.id);
    if (!jogo) return res.status(404).send("Jogo não encontrado.");
    const amigos = await Amigo.findAll({ order: [["nome", "ASC"]] });
    res.render("jogos/editar", { jogo, amigos });
});

app.post("/jogos/editar/:id", async (req, res) => {
    const { titulo, plataforma, amigoId } = req.body;
    await Jogo.update(
        { titulo, plataforma, amigoId: Number(amigoId) },
        { where: { id: req.params.id } },
    );
    res.redirect("/jogos");
});

app.post("/jogos/excluir/:id", async (req, res) => {
    await Jogo.destroy({ where: { id: req.params.id } });
    res.redirect("/jogos");
});

// EMPRESTIMOS
app.get("/emprestimos", async (req, res) => {
    const emprestimos = await Emprestimo.findAll({
        include: [
            { model: Jogo, as: "jogo" },
            { model: Amigo, as: "amigo" },
        ],
        order: [["id", "ASC"]],
    });
    res.render("emprestimos/index", { emprestimos });
});

app.get("/emprestimos/novo", async (req, res) => {
    const jogos = await Jogo.findAll({ order: [["titulo", "ASC"]] });
    const amigos = await Amigo.findAll({ order: [["nome", "ASC"]] });
    res.render("emprestimos/novo", { jogos, amigos });
});

app.post("/emprestimos/novo", async (req, res) => {
    const { jogoId, amigoId, dataInicio, dataFim } = req.body;
    await Emprestimo.create({
        jogoId: Number(jogoId),
        amigoId: Number(amigoId),
        dataInicio,
        dataFim: dataFim || null,
    });
    res.redirect("/emprestimos");
});

app.post("/emprestimos/excluir/:id", async (req, res) => {
    await Emprestimo.destroy({ where: { id: req.params.id } });
    res.redirect("/emprestimos");
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
