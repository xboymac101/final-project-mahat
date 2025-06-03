import React from "react";
import { Link } from "react-router-dom";
import classes from "./RelatedProducts.module.css";

function RelatedProducts({ related }) {
  return (
    <div className={classes.section}>
      <h3>Related Books</h3>
      <div className={classes.relatedRow}>
        {related.length === 0 ? (
          <div>No related books.</div>
        ) : (
          related.map((b) => (
            <Link
              to={`/book/${b.book_id}`}
              key={b.book_id}
              className={classes.relatedCard}
            >
              <img src={b.img} alt={b.title} className={classes.relatedImg} />
              <div className={classes.relatedTitle}>{b.title}</div>
              <div className={classes.relatedAuthor}>{b.author}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default RelatedProducts;
