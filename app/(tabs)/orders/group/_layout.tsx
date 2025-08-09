import { Stack } from 'expo-router';

export default function GroupOrderLayout() {
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
        {{ title: 'Group Orders',
          // headerTitle:"Group Orders",
          // headerShown: true,
          // headerStyle:{
          //   backgroundColor: '#007AFF',
          // }
         }} 
      />
      <Stack.Screen 
        name="details" 
        options={{ title: 'Group Order Details' }} 
      />
    </Stack>
  );
}