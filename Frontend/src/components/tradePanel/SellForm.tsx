import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { apiService } from "../../services/api";
import { Button } from "../common/Buttom";
import { Card } from "../common/Card";
import { Input } from "../common/Input";

interface SellFormProps {
  market: string;
  userId: string;
}

export const SellForm = ({ market, userId }: SellFormProps) => {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      apiService.createOrder({
        market,
        price,
        quantity,
        side: "sell",
        userId,
      }),
    onSuccess: (response) => {
      setSuccess(`Sell order placed! ID: ${response.payload?.orderId}`);
      setPrice("");
      setQuantity("");

      queryClient.invalidateQueries({ queryKey: ["orders", userId, market] });

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
        <h3 className="text-lg font-semibold text-sell mb-3">Sell</h3>

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
          variant="danger"
          loading={isPending}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Placing..." : "Place Sell Order"}
        </Button>
      </form>
    </Card>
  );
};
