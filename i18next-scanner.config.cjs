const fs = require("fs");
const path = require("path");
const { Parser } = require("i18next-scanner");

module.exports = {
  input: ["src/**/*.{js,jsx,ts,tsx}", "electron/**/*.{js,ts}"],
  output: "./",
  options: {
    debug: false,
    sort: true,
    lngs: ["fr", "en", "zh"],
    defaultLng: "fr",
    defaultNs: "translation",
    ns: ["translation"],
    keySeparator: ".", // autorise les hiérarchies (ex: "students.importCSV.title")
    nsSeparator: false,
    defaultValue: (lng, ns, key) => key, // par défaut, valeur = clé
  },
  transform: function customTransform(file, enc, done) {
    const content = fs.readFileSync(file.path, enc);
    const parser = new Parser({});

    parser.parseFuncFromString(content.toString(), { list: ["t"] }, (key) => {
      this.parser.set(key, key);
    });

    done();
  },
  flush: function (done) {
    const resStore = this.parser.get({ sort: true });
    const localesDir = path.join(process.cwd(), "src", "locales");

    if (!fs.existsSync(localesDir)) {
      fs.mkdirSync(localesDir, { recursive: true });
    }

    for (const lng of ["fr", "en", "zh"]) {
      const file = path.join(localesDir, `${lng}.json`);
      const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};

      // merge récursif pour conserver ce qui existe
      const deepMerge = (target, source) => {
        for (const key in source) {
          if (
            typeof source[key] === "object" &&
            source[key] !== null &&
            !Array.isArray(source[key])
          ) {
            target[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            target[key] = target[key] || source[key];
          }
        }
        return target;
      };

      const updated = deepMerge(existing, resStore[lng].translation);

      fs.writeFileSync(file, JSON.stringify(updated, null, 2), "utf8");
      console.log(`✅ Fichier mis à jour : ${file}`);
    }

    done();
  },
};
