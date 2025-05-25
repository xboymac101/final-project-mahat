import React from 'react';

function Main() {
  const products = [
    { id: 1, name: 'Milk', price: 100 },
    { id: 2, name: 'Bread', price: 50 },
    { id: 3, name: 'Cheese', price: 200 },
    { id: 4, name: 'Butter', price: 150 },
  ];

  return (
    <div className='main'>
      <div className='container'>
        <ul>
          {products.map((elem, ind) => {
            return (
              <li key={`stud-${ind}`}>
                {elem.name} - {elem.price}{' '}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default Main;
