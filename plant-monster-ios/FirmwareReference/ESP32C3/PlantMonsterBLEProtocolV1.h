#pragma once

#include <stddef.h>
#include <stdint.h>

namespace plant_monster_ble_v1 {

inline constexpr char kServiceUUID[] = "7A3E0001-7E5B-4B7C-A1A0-6C6B504D0001";
inline constexpr char kTelemetryUUID[] = "7A3E0002-7E5B-4B7C-A1A0-6C6B504D0001";
inline constexpr char kCommandUUID[] = "7A3E0003-7E5B-4B7C-A1A0-6C6B504D0001";

inline constexpr uint8_t kMagic = 0xA5;
inline constexpr uint8_t kVersion = 0x01;
inline constexpr uint8_t kTelemetryPacketType = 0x01;
inline constexpr uint8_t kCommandPacketType = 0x10;

enum TelemetryFlags : uint8_t {
  kTouchActive = 1 << 0,
  kMoving = 1 << 1,
};

enum CommandID : uint8_t {
  kIdentify = 0x01,
  kShowExpression = 0x02,
};

enum AckStatus : uint8_t {
  kNoAck = 0,
  kApplied = 1,
  kUnsupported = 2,
  kInvalidPayload = 3,
  kBusy = 4,
};

enum ExpressionID : uint8_t {
  kNoExpression = 0,
  kIdleMean = 1,
  kSunComfy = 2,
  kFindLight = 3,
  kTooBright = 4,
  kSleeping = 5,
  kCold = 6,
  kHot = 7,
  kThirsty = 8,
  kWatered = 9,
  kPickedUp = 10,
  kDizzy = 11,
  kWink = 12,
  kEnjoyingTouch = 13,
  kAnnoyed = 14,
  kPollination = 15,
};

#pragma pack(push, 1)
struct TelemetryPacket {
  uint8_t magic = kMagic;
  uint8_t version = kVersion;
  uint8_t packet_type = kTelemetryPacketType;
  uint8_t flags = 0;
  uint16_t sample_sequence = 0;
  int16_t temperature_centi_c = 0;
  uint16_t air_humidity_centi_percent = 0;
  uint16_t substrate_centi_percent = UINT16_MAX;
  uint32_t illuminance_lux = 0;
  uint8_t expression_id = kNoExpression;
  uint8_t acknowledged_command_sequence = 0;
  uint8_t acknowledgement_status = kNoAck;
  uint8_t crc = 0;
};

struct CommandPacket {
  uint8_t magic;
  uint8_t version;
  uint8_t packet_type;
  uint8_t sequence;
  uint8_t command_id;
  uint8_t value;
  uint8_t reserved;
  uint8_t crc;
};
#pragma pack(pop)

static_assert(sizeof(TelemetryPacket) == 20, "Telemetry packet must remain 20 bytes");
static_assert(sizeof(CommandPacket) == 8, "Command packet must remain 8 bytes");

inline uint8_t crc8_atm(const uint8_t* data, size_t length) {
  uint8_t checksum = 0;
  for (size_t index = 0; index < length; ++index) {
    checksum ^= data[index];
    for (uint8_t bit = 0; bit < 8; ++bit) {
      checksum = (checksum & 0x80) ? static_cast<uint8_t>((checksum << 1) ^ 0x07)
                                   : static_cast<uint8_t>(checksum << 1);
    }
  }
  return checksum;
}

inline bool is_valid_command(const uint8_t* data, size_t length) {
  if (length != sizeof(CommandPacket)) return false;
  const auto* packet = reinterpret_cast<const CommandPacket*>(data);
  return packet->magic == kMagic &&
         packet->version == kVersion &&
         packet->packet_type == kCommandPacketType &&
         packet->sequence != 0 &&
         packet->reserved == 0 &&
         crc8_atm(data, sizeof(CommandPacket) - 1) == packet->crc;
}

inline void finalize_telemetry(TelemetryPacket& packet) {
  packet.crc = crc8_atm(reinterpret_cast<const uint8_t*>(&packet), sizeof(packet) - 1);
}

}  // namespace plant_monster_ble_v1
