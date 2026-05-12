module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      function({ types: t }) {
        return {
          name: 'expo-import-meta-fix',
          visitor: {
            MetaProperty(path) {
              if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                path.replaceWith(
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('url'),
                      t.stringLiteral('http://localhost')
                    ),
                    t.objectProperty(
                      t.identifier('env'),
                      t.memberExpression(t.identifier('process'), t.identifier('env'))
                    )
                  ])
                );
              }
            }
          },
        };
      },
    ],
  };
};