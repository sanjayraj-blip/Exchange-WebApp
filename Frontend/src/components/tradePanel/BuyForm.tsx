import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiService } from "../../services/api";
import { Button } from "../common/Buttom";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
interface BuyFormProps {
  market: string;
  userId: string;
}

export const BuyForm = ({ market, userId }: BuyFormProps) => {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // useMutation handles all loading/error state automatically
  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      apiService.createOrder({
        market,
        price,
        quantity,
        side: "buy",
        userId,
      }),
    onSuccess: (response) => {
      // After successful order
      setSuccess(`Buy order placed! ID: ${response.payload?.orderId}`);
      setPrice("");
      setQuantity("");

      // Invalidate cache - React Query auto-refetches
      queryClient.invalidateQueries({ queryKey: ["orders", userId, market] });

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !quantity) return;
    mutate();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-lg font-semibold text-buy mb-3">Buy</h3>

        <Input
          label="Price"
          type="number"
          step="0.01"
          placeholder="Enter price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={isPending}
        />

        <Input
          label="Quantity"
          type="number"
          step="0.0001"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={isPending}
        />

        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">
            {error instanceof Error ? error.message : "Failed to place order"}
          </div>
        )}

        {success && (
          <div className="text-green-500 text-sm p-2 bg-green-900/20 rounded">
            {success}
          </div>
        )}

        <Button
          type="submit"
          variant="success"
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Placing..." : "Place Buy Order"}
        </Button>
      </form>
    </Card>
  );
};
