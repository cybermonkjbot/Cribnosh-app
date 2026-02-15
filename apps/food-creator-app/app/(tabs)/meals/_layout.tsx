import { Stack } from 'expo-router';

export default function MealsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Meal Management' }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ title: 'Create Meal' }} 
      />
      <Stack.Screen 
        name="[id]/edit" 
        options={{ title: 'Edit Meal' }} 
      />
    </Stack>
  );
}

