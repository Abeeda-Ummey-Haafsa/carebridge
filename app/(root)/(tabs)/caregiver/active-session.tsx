import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { icons } from "@/constants";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

// Mock Elder Data
const elderMock = {
  name: "Elena Rodriguez",
  age: 82,
  careType: "Medical Care",
  address: "123 Care Lane, City",
  latitude: 37.78825, // Mock coords
  longitude: -122.4324,
  phone: "555-0192",
};

// Caregiver Location Mock
const caregiverLocation = {
  latitude: 37.77825,
  longitude: -122.4124,
};

const INITIAL_TASKS = [
  { id: "1", title: "Administer Morning Medication", completed: false },
  { id: "2", title: "Check Blood Pressure", completed: false },
  { id: "3", title: "Prepare Breakfast", completed: true },
  { id: "4", title: "Light Physical Therapy", completed: false },
];

export default function ActiveSession() {
  const [sessionStatus, setSessionStatus] = useState<
    "en_route" | "in_progress" | "completed"
  >("en_route");
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [notes, setNotes] = useState("");
  const [eta, setEta] = useState("--");
  const [distance, setDistance] = useState("--");

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStatus === "in_progress") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleSessionAction = () => {
    if (sessionStatus === "en_route") setSessionStatus("in_progress");
    else if (sessionStatus === "in_progress") setSessionStatus("completed");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Session Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Session</Text>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  sessionStatus === "in_progress" ? "#1fb299" : "#f59e0b",
              },
            ]}
          />
          <Text style={styles.statusText}>
            {sessionStatus === "en_route"
              ? "En Route"
              : sessionStatus === "in_progress"
                ? "In Progress"
                : "Completed"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Integration */}
        {sessionStatus !== "completed" && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: elderMock.latitude,
                longitude: elderMock.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              showsUserLocation
            >
              <Marker
                coordinate={{
                  latitude: elderMock.latitude,
                  longitude: elderMock.longitude,
                }}
              >
                <Image
                  source={icons.marker}
                  style={{ width: 30, height: 30 }}
                />
              </Marker>

              {directionsAPI && (
                <MapViewDirections
                  origin={caregiverLocation}
                  destination={{
                    latitude: elderMock.latitude,
                    longitude: elderMock.longitude,
                  }}
                  apikey={directionsAPI}
                  strokeWidth={4}
                  strokeColor="#0286FF"
                  onReady={(result) => {
                    setDistance(result.distance.toFixed(1) + " mi");
                    setEta(Math.ceil(result.duration) + " min");
                  }}
                />
              )}
            </MapView>

            {sessionStatus === "en_route" && (
              <View style={styles.mapOverlayInfo}>
                <View style={styles.etaBox}>
                  <Text style={styles.etaLabel}>ETA</Text>
                  <Text style={styles.etaValue}>{eta}</Text>
                </View>
                <View style={styles.etaBox}>
                  <Text style={styles.etaLabel}>Distance</Text>
                  <Text style={styles.etaValue}>{distance}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Elder Info Card */}
        <View style={styles.card}>
          <View style={styles.elderInfoRow}>
            <Image
              source={icons.woman}
              style={styles.avatar}
            />
            <View style={styles.elderDetails}>
              <Text style={styles.elderName}>{elderMock.name}</Text>
              <Text style={styles.elderSub}>
                {elderMock.careType} • {elderMock.age} yrs
              </Text>
              <View style={styles.addressRow}>
                <Image source={icons.pin} style={styles.addressIcon} />
                <Text style={styles.addressText}>{elderMock.address}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button & Timer */}
        <View style={styles.timerSection}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerLabel}>Elapsed Time</Text>
            <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.mainActionButton,
              sessionStatus === "in_progress" && styles.checkOutButton,
            ]}
            onPress={handleSessionAction}
            disabled={sessionStatus === "completed"}
          >
            <Text style={styles.mainActionText}>
              {sessionStatus === "en_route"
                ? "Check In"
                : sessionStatus === "in_progress"
                  ? "Check Out"
                  : "Session Ended"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Care Tasks Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Care Tasks</Text>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskRow}
              onPress={() => toggleTask(task.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  task.completed && styles.checkboxCompleted,
                ]}
              >
                {task.completed && (
                  <Image source={icons.checkmark} style={styles.checkIcon} />
                )}
              </View>
              <Text
                style={[
                  styles.taskText,
                  task.completed && styles.taskTextCompleted,
                ]}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session Notes */}
        <View style={[styles.card, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Session Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Add observations, vitals, or important notes..."
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f8f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    padding: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlayInfo: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    borderRadius: 12,
  },
  etaBox: {
    alignItems: "center",
  },
  etaLabel: {
    fontSize: 10,
    color: "#6c757d",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  etaValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1fb299",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  elderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  elderDetails: {
    flex: 1,
  },
  elderName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  elderSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  addressIcon: {
    width: 10,
    height: 10,
    tintColor: "#a0bff0",
  },
  addressText: {
    fontSize: 12,
    color: "#a0bff0",
  },
  callButton: {
    backgroundColor: "#e6f8f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callButtonText: {
    color: "#1fb299",
    fontWeight: "bold",
  },
  timerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  timerDisplay: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: "#888",
  },
  timerValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#333",
    fontVariant: ["tabular-nums"],
  },
  mainActionButton: {
    backgroundColor: "#050b14",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  checkOutButton: {
    backgroundColor: "#ef4444",
  },
  mainActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#1fb299",
    borderColor: "#1fb299",
  },
  checkIcon: {
    width: 12,
    height: 12,
    tintColor: "#fff",
  },
  taskText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  taskTextCompleted: {
    color: "#888",
    textDecorationLine: "line-through",
  },
  notesInput: {
    backgroundColor: "#f9fbfd",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: "#333",
  },
});
