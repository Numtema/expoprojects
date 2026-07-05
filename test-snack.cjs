const { Snack } = require('snack-sdk');
async function run() {
  const snack = new Snack({
    sdkVersion: '51.0.0',
    name: 'Test App',
    files: {
      'App.js': { type: 'CODE', contents: 'import React from "react"; import { Text } from "react-native"; export default () => <Text>Hello</Text>;' }
    }
  });
  const res = await snack.saveAsync();
  console.log(res);
}
run().catch(console.error);
