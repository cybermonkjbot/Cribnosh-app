import { Stack } from 'expo-router';

export default function GroupLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="select-meal"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[participant_id]/selections"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
