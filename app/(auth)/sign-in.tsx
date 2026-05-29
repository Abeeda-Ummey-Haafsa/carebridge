import { useSignIn, useUser } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import ReactNativeModal from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { getHomeRouteByRole } from "@/lib/utils";
import { useUserStore } from "@/store";

const SignIn = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { user } = useUser();
  const { setRole, setUser } = useUserStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default", // default | pending
    code: "",
    error: "",
  });

  // 🔐 Step 1: Sign in
  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        try {
          const userData = await fetchAPI(
            `/(api)/user?email=${encodeURIComponent(form.email)}`,
          );
          const userRole = userData?.data?.role;
          // const userRole = userData?.data?.role || "caregiver";
          if (userData?.data) {
            setUser({
              id: userData.data.id,
              clerk_id: userData.data.clerk_id,
              name: userData.data.name,
              email: userData.data.email,
              role: userRole,
              created_at: userData.data.created_at,
            });
          }
          setRole(userRole);
          const homeRoute = getHomeRouteByRole(userRole);
          router.replace(homeRoute as any);
        } catch (err) {
          console.error("Failed to fetch user role:", err);
          // router.replace("/(root)/(tabs)/caregiver/home");
        }
      } else if (signInAttempt.status === "needs_second_factor") {
        // Trigger email OTP
        await signInAttempt.prepareSecondFactor({
          strategy: "email_code" as any,
        });

        setVerification({
          state: "pending",
          code: "",
          error: "",
        });
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Unexpected sign-in state.");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors?.[0]?.longMessage || "Login failed");
    }
  }, [isLoaded, form, setRole]);

  // 🔐 Step 2: Verify OTP
  const onVerifyCode = async () => {
    if (!isLoaded) return;
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code" as any,
        code: verification.code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        try {
          const userData = await fetchAPI(
            `/(api)/user?email=${encodeURIComponent(form.email)}`,
          );
          const userRole = userData?.data?.role || "caregiver";
          if (userData?.data) {
            setUser({
              id: userData.data.id,
              clerk_id: userData.data.clerk_id,
              name: userData.data.name,
              email: userData.data.email,
              role: userRole,
              created_at: userData.data.created_at,
            });
          }
          // Why caregiver as the default
          // If the API response is malformed or the role field is unexpectedly missing/null,
          // the app still has a valid role to work with rather than breaking with undefined.
          setRole(userRole);
          const homeRoute = getHomeRouteByRole(userRole);
          router.replace(homeRoute as any);
        } catch (err) {
          console.error("Failed to fetch user role:", err);
          router.replace("/(root)/(tabs)/caregiver/home");
        }

        setVerification({ state: "default", code: "", error: "" });
      } else {
        setVerification((prev) => ({
          ...prev,
          error: "Invalid verification code",
        }));
      }
    } catch (err: any) {
      setVerification((prev) => ({
        ...prev,
        error: err.errors?.[0]?.longMessage || "Verification failed",
      }));
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Welcome 👋
          </Text>
        </View>

        {/* Form */}
        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />

          <CustomButton
            title="Sign In"
            onPress={onSignInPress}
            className="mt-6"
          />

          <OAuth />

          <Link
            href="/sign-up"
            className="text-lg text-center text-general-200 mt-10"
          >
            Don't have an account?{" "}
            <Text className="text-primary-500">Sign Up</Text>
          </Link>
        </View>
      </View>

      {/* 🔐 2FA Verification Modal */}
      <ReactNativeModal isVisible={verification.state === "pending"}>
        <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
          <Text className="font-JakartaExtraBold text-2xl mb-2">
            Verification
          </Text>

          <Text className="font-Jakarta mb-5">
            Enter the code sent to your email.
          </Text>

          <InputField
            label="Code"
            icon={icons.lock}
            placeholder="123456"
            keyboardType="numeric"
            value={verification.code}
            onChangeText={(code) =>
              setVerification((prev) => ({ ...prev, code }))
            }
          />

          {verification.error && (
            <Text className="text-red-500 text-sm mt-1">
              {verification.error}
            </Text>
          )}

          <CustomButton
            title="Verify Code"
            onPress={onVerifyCode}
            className="mt-5 bg-success-500"
          />
        </View>
      </ReactNativeModal>
    </ScrollView>
  );
};

export default SignIn;
