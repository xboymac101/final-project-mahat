import React from 'react';
import { useParams } from 'react-router-dom';

function BookDetails() {
  const { id } = useParams();
  return (
    <div>
      <h1>Book Details</h1>
      <p>Details for book with ID: {id}</p>
      {/* Replace with real book info later */}
    </div>
  );
}
export default BookDetails;
