import app from "./src/app.js";
import "colors";

const port = process.env.PORT || 3001;

app.listen(port, () =>
  console.info(
    `EL SERVIDOR SE ESTA EJECUTANDO EN: http://localhost:${port}`.blue
  )
);
