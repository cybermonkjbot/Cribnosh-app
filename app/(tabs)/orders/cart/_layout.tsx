import { Stack } from 'expo-router';

export default function CartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation:"transparentModal",
        animation:"slide_from_bottom",
        contentStyle: { backgroundColor: "transparent" },
        

      }}
    >
      <Stack.Screen 
        name="index" 
        options=
        {{ title: 'Cart',
          // headerTitle:"Group Orders",
          // headerShown: true,
          // headerStyle:{
          //   backgroundColor: '#007AFF',
          // }
         }} 
      />
      <Stack.Screen 
        name="sides" 
        options={{ title: 'Cart slides' }} 
      />
    </Stack>
  );
}