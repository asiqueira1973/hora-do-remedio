module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite importar os arquivos .sql das migrations (7.9) como texto puro,
    // para o migrator do Drizzle rodar o SQL empacotado no bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
