import React from "react";
import { CalendarEvent } from "@/types/types";
import {
  formatReadableDate,
  formatReadableTime,
} from "../../../utils/dateHelpers";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@gluestack-ui/themed";
import { ModalContent } from "@gluestack-ui/themed";
import { ModalCloseButton } from "@gluestack-ui/themed";
import { View } from "@gluestack-ui/themed";

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />

      <ModalContent>
        <ModalHeader>
          <Heading size="lg">{event.platform}</Heading>
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {/* INFO GRID */}
          <View style={{ gap: 12 }}>
            {/* CAMPAIGN */}
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 2,
                }}
              >
                Campaign
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#020617",
                  lineHeight: 20,
                }}
              >
                {event.campaign}
              </Text>
            </View>

            {/* SUBJECT */}
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 2,
                  lineHeight: 20,
                }}
              >
                Subject
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: "#020617",
                  lineHeight: 20,
                }}
              >
                {event.subject}
              </Text>
            </View>

            {/* DATE & TIME */}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 2,
                  }}
                >
                  Date
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#020617",
                    lineHeight: 20,
                  }}
                >
                  {formatReadableDate(event.start)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 2,
                  }}
                >
                  Time
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#020617",
                    lineHeight: 20,
                  }}
                >
                  {formatReadableTime(event.start)}
                </Text>
              </View>
            </View>
          </View>

          {/* MESSAGE SECTION */}
          <View
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#64748b",
                marginBottom: 6,
              }}
            >
              Message
            </Text>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "#020617",
              }}
            >
              {event.message}
            </Text>
          </View>
        </ModalBody>

        <ModalFooter>
          <Button
            action="primary"
            onPress={onClose}
            style={{
              marginTop: 16,
              backgroundColor: "#9ca3af",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <ButtonText
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "600",
                letterSpacing: 0.5,
                lineHeight: 15,
              }}
            >
              Close
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventModal;
