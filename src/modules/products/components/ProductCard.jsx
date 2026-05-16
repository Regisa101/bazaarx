import { Link } from "react-router-dom";
import "./ProductCard.css";

export function StarRating({ rating, size = "sm" }) {
  const safeRating = typeof rating === "number" && !isNaN(rating) ? Math.min(5, Math.max(0, rating)) : 0;
  return (
    <div className={`star-rating star-rating--${size}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = safeRating >= star;
        const half = !filled && safeRating + 0.5 >= star;
        return (
          <span
            key={star}
            className={`star ${filled ? "star--full" : half ? "star--half" : "star--empty"}`}
          >★</span>
        );
      })}
    </div>
  );
}

export function getAvgRating(reviews, fallback) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return 0; // Always return 0 if no reviews, ignore fallback
  }
  const total = reviews.reduce((sum, r) => sum + (typeof r.rating === "number" ? r.rating : 0), 0);
  return total / reviews.length;
}

export default function ProductCard({ product }) {
  const avgRating = getAvgRating(product.reviews, product.rating);
  const reviewCount = Array.isArray(product.reviews) ? product.reviews.length : 0;
  const isOutOfStock = product.stock === 0;

  return (
    <Link to={`/buyer/product/${product.id}`} className={`product-card ${isOutOfStock ? "product-card--oos" : ""}`}>
      <div className="card-image-wrap">
        <img src={product.image} alt={product.name} className="card-image" />
        <span className="card-category">{product.category}</span>
        {isOutOfStock && <div className="card-oos-badge">Out of Stock</div>}
        {!isOutOfStock && product.stock < 5 && (
          <div className="card-low-stock-badge">Only {product.stock} left</div>
        )}
      </div>
      <div className="card-body">
        <p className="card-seller">{product.seller}</p>
        <h3 className="card-name">{product.name}</h3>
        <div className="card-rating-row">
          <StarRating rating={avgRating} size="sm" />
          {reviewCount > 0 ? (
            <>
              <span className="card-rating-num">{avgRating.toFixed(1)}</span>
              <span className="card-review-count">({reviewCount})</span>
            </>
          ) : (
            <span className="card-no-rating">No ratings yet</span>
          )}
        </div>
        <div className="card-footer">
          <span className="card-price">Rs. {product.price.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}