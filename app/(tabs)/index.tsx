import { MainScreen } from "@/components/ui/MainScreen";
import React from "react";
import "../../global.css";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  //return <MainScreen />;
  return <Redirect href={"/orders/cart"} />;
}
