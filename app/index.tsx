import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { fetchAPI } from "@/lib/fetch";
import { getHomeRouteByRole } from "@/lib/utils";
import { useUserStore } from "@/store";

const Page = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { setRole, setUser } = useUserStore();
  const [homeRoute, setHomeRoute] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn || !user?.id) {
        if (isMounted) {
          setHomeRoute(null);
        }
        return;
      }

      try {
        const userData = await fetchAPI(`/(api)/user?clerkId=${user.id}`);
        const profile = userData?.data;

        if (profile) {
          setUser({
            id: profile.id,
            clerk_id: profile.clerk_id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            created_at: profile.created_at,
          });
          setRole(profile.role);

          if (isMounted) {
            setHomeRoute(getHomeRouteByRole(profile.role));
          }
        }
      } catch {
        if (isMounted) {
          setHomeRoute("/(auth)/welcome");
        }
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user?.id, setRole, setUser]);

  if (!isLoaded || (isSignedIn && !homeRoute)) {
    return null;
  }

  if (isSignedIn && homeRoute) return <Redirect href={homeRoute as any} />;

  return <Redirect href="/(auth)/welcome" />;
};

export default Page;
