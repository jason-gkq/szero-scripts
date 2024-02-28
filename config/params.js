const args = {};
const params = process.argv.splice(2);

if (!params.length) {
  throw new Error(
    'The ENV environment variable is required but was not specified.'
  );
}

params.forEach((arg) => {
  const tmpArg = arg.trim().split('=');
  if (tmpArg.length) {
    args[tmpArg[0].replace(/\W+/g, '')] = tmpArg[1];
  } else {
    return false;
  }
});
if (!args || !args.env) {
  throw new Error(
    'The ENV environment variable is required but was not specified.'
  );
}

process.env.BUILD_ENV = args.env || 'local';

export default { ...args };
