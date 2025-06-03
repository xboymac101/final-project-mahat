import React from "react";
import classes from "./Reviews.module.css";

function Reviews({ reviews }) {
  return (
    <div className={classes.section}>
      <h3>Reviews</h3>
      {reviews.length === 0 ? (
        <div>No reviews yet.</div>
      ) : (
        <div className={classes.reviewRow}>
          {reviews.map((review) => (
            <div key={review.review_id} className={classes.reviewCard}>
              <div className={classes.username}>{review.username}</div>
              <div className={classes.rating}>
                <span className={classes.starGold}>{"★".repeat(review.rating)}</span>
                <span className={classes.starGray}>{"★".repeat(5 - review.rating)}</span>
              </div>
              <div className={classes.comment}>{review.comment}</div>
              <div className={classes.date}>{review.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reviews;
