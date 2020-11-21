const { 
  Engine,
  Render,
  Runner, 
  World, 
  Bodies, 
  Body, //iti da acces la diferite proprietati ale unei forme
  Events //evenimentele formelor
} = Matter; //destructuring(scoaterea de info) Engine-tranzitie; Render-ptr desen; Runner-coordoneaza update uri intre engine si world;bodies-referinta la colectia modelelor ce pot fi desenate; 

const cellsHorizontal = 10;
const cellsVertical = 10;
const width = window.innerWidth - 10; 
const height = window.innerHeight - 10;

const unitLengthX = width / cellsHorizontal; //latimea unui spatiu
const unitLengthY = height / cellsVertical; //inaltimea unui spatiu

const engine = Engine.create();
engine.world.gravity.y = 0; //dezactiveaza gravitatia
const { world } = engine;
const render = Render.create({ //cream obiectul render
  element: document.body, //render va reprezenta lumea in document.body
  engine: engine, //ce engine sa foloseasca 
  options: {  //marimea canvas-ului
    wireframes: false, //ca elementele sa fie solide
    width,
    height
  }
});
Render.run(render); //trebuie sa ii apelam metoda "run" pentru a se crea canvas-ul
Runner.run(Runner.create(), engine); //coordoneaza schimbarile engine-ului

 
// Walls
const walls = [ //peretii se vor forma in functie de marimea canvas-ului
  //sus
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),   // - distanta de la stanga, la jumatatea lungimii; -distanta in jos -latimea dreptunghiului care trebuie sa fie ca latimea canvas-ului; -inaltimea dreptunghiului
  //jos
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  //stanga
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  //dreapta
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

            // Maze generation

const shuffle = arr => { //primeste ca parametru un array si aseaza random toate elementele din el(randomizeaza vecinii posibili din momentul t)
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical) //creeaza un array gol (cellsVertical reprezinta nr de linii)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false)); //( cellsHorizontal reprezinta nr de coloane)se face fill-ul cu map(adica se apeleaza functia de creare array de cellsHorizontal ori, si cele cellsHorizontal arrayuri vor fi diferite), daca il fac fara, cand vreau o sa modific un element in array o sa se modifice toti, nu doar cel ales de mine

const verticals = Array(cellsVertical) //repsrezinta peretii verticali din interiorul labirintului
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1) //repsrezinta peretii orizontali din interiorul labirintului
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

    //Punctul de plecare in labirint e ales random
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

  //iteratia prin labirint
const stepThroughCell = (row, column) => {
  //daca am vizitat patratelul la [linie, coloana], atunci return
  if (grid[row][column]) {
    return;
  }

  //marchez patratelul ca vizitat
  grid[row][column] = true;

  //pentru fiecare vecin...
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
  ]);
  // For each neighbor....
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor; //celula pe care ne gandim sa o vizitam in continuare

    //verificam daca de la acel vecin mai avem unde sa mergem in continuare
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }

    //daca am vizitat vecinul, continuam cu urmatorul vecin
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    //stergem peretele orizontal sau vertical
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

// row-elementul pe care ni-l returneaza, rowIndex- indexul elementului returnat
horizontals.forEach((row, rowIndex) => { //cu forEach o sa primim un un array din interiorul horizantals
  row.forEach((open, columnIndex) => { //daca open e true, inseamna ca nu e perete
    if (open) {
      return;
    }
    //formulele pentru construirea dreptunghiurilor care reprezinta peretii

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX, //lungimea dreptunghiului
      5, //inaltimea dreptunghiului 
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red'
        }
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red'
        }
      }
    );
    World.add(world, wall);
  });
});

// Goal

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    label: 'goal', //trebuie dat alt nume ptr coliziune, altfel se va numi "rectangle"
    isStatic: true,
    render: {
      fillStyle: 'green'
    }
  }
);
World.add(world, goal);

// Ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: 'ball',
  render: {
    fillStyle: 'blue'
  }
});
World.add(world, ball);


//Setam viteza bilei
document.addEventListener('keydown', event => {
  const { x, y } = ball.velocity; //accesam coordonatele bilei

  if (event.code === "KeyW") {
    Body.setVelocity(ball, { x, y: y - 5 });
  }

  if (event.code === "KeyD") {
    Body.setVelocity(ball, { x: x + 5, y });
  }

  if (event.code === 'KeyS') {
    Body.setVelocity(ball, { x, y: y + 5 });
  }

  if (event.code === 'KeyA') {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// Win Condition

Events.on(engine, 'collisionStart', event => {//eventul se declanseaza de fiecare data cand apare o coliziune intre 2 elem
  event.pairs.forEach(collision => {
    const labels = ['ball', 'goal'];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector('.winner').classList.remove('hidden');
      world.gravity.y = 1; //activam gravitatia
      world.bodies.forEach(body => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);//acest obiect(body) nu mai este static, diferite elemente il pot afecta 
        }
      });
    }
  });
});
