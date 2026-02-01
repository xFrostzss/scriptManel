"use strict";
module.exports = (sequelize, DataTypes) => {
    const Amigo = sequelize.define(
        "Amigo",
        {
            nome: { type: DataTypes.STRING, allowNull: false },
            email: { type: DataTypes.STRING, allowNull: false },
            // DICA: Se fores usar o login, lembra-te de verificar se a senha está aqui!
        },
        { tableName: "Amigo" },
    );
    Amigo.associate = function(models) {
        Amigo.hasMany(models.Jogo, { foreignKey: 'amigoId', as: 'jogos' });
        Amigo.hasMany(models.Emprestimo, { foreignKey: 'amigoId', as: 'emprestimos' });
    };

    return Amigo;
};