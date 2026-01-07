import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "@gluestack-ui/themed";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Previous */}
      <Pressable
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#d1d5db",
          backgroundColor: "#ffffff",
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
      >
       
        <Ionicons name="chevron-back" size={20} color="gray" />
      </Pressable>

      {/* Page Numbers */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginLeft: 8,
        }}
      >
        {pagesArray.map((page) => {
          const isActive = page === currentPage;

          return (
            <Pressable
              key={page}
              onPress={() => onPageChange(page)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#d1d5db",
                marginRight: 8,
                backgroundColor: isActive ? "#dc2626" : "#ffffff",
              }}
            >
             
              <Text style={{ color: isActive ? "white" : "black" }}>
                {page}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Next */}
      <Pressable
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#d1d5db",
          backgroundColor: "#ffffff",
          opacity: currentPage === totalPages ? 0.5 : 1,
          marginLeft: 8,
        }}
      >
        
        <Ionicons name="chevron-forward" size={20} color="black" />
      </Pressable>
    </View>
  );
}
