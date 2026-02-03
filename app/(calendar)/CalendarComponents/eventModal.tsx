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

        <ModalBody>
          {/* PLATFORM */}
          <Text style={{ fontSize: 16, marginBottom: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Campaign:</Text>{" "}
            {event.campaign}
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Platform:</Text>{" "}
            {event.platform.toUpperCase()}
          </Text>

          {/* DATE */}
          <Text style={{ fontSize: 16, marginBottom: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
            {formatReadableDate(event.start)}
          </Text>

          {/* TIME */}
          <Text style={{ fontSize: 16, marginBottom: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Time:</Text>{" "}
            {formatReadableTime(event.start)}
          </Text>

          {/* MESSAGE */}
          <Text style={{ fontSize: 16, marginTop: 12 }}>
            <Text style={{ fontWeight: "bold" }}>Message:</Text>
            {"\n"}
            {event.message}
          </Text>
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
                lineHeight: 15
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
