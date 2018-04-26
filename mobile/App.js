import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { dostuff } from './dist'

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Button
          onPress={() => {
            dostuff();
          }}
          title="Click me" />
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
