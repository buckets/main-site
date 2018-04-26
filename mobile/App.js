import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dostuff } from './dist'

export default class App extends React.Component {
  render() {
    const a = dostuff();
    console.log('a', a);
    return (
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
