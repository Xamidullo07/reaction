import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Atom, Element } from "./types/chemistry";
import { REACTIONS } from "./data/elements";
import { ReactionChamber } from "./components/ReactionChamber";
import { ControlPanel } from "./components/ControlPanel";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";

function App() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [isReacting, setIsReacting] = useState(false);
  const [chamberColor, setChamberColor] = useState<string | undefined>();
  const [equation, setEquation] = useState<string>("");
  const [selectedReactionName, setSelectedReactionName] = useState<
    string | null
  >(null);

  // Add atom to chamber with random position
  const addAtom = useCallback((element: Element) => {
    const newAtom: Atom = {
      id: `${element.id}-${Date.now()}-${Math.random()}`,
      element,
      x: Math.random() * 200 + 40, // Keep within chamber bounds
      y: Math.random() * 150 + 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    };
    setAtoms((prev) => [...prev, newAtom]);
    setProducts([]);
    setChamberColor(undefined);
    setEquation("");
    setSelectedReactionName(null);
  }, []);

  // Remove atom
  const removeAtom = useCallback((id: string) => {
    setAtoms((prev) => prev.filter((atom) => atom.id !== id));
  }, []);

  // Check for possible reactions
  const checkReaction = useCallback(() => {
    const counts = atoms.reduce(
      (acc, atom) => {
        acc[atom.element.id] = (acc[atom.element.id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const reaction of REACTIONS) {
      const match = reaction.reactants.every(
        (r) => counts[r.elementId] >= r.count,
      );
      if (match) {
        return reaction;
      }
    }
    return null;
  }, [atoms]);

  const possibleReaction = checkReaction();
  const canReact = !!possibleReaction;

  // Execute Reaction
  const handleReact = () => {
    if (!possibleReaction) return;

    setIsReacting(true);
    setSelectedReactionName(possibleReaction.nameUz);

    // Consume reactants
    const remainingAtoms = [...atoms];
    possibleReaction.reactants.forEach((r) => {
      for (let i = 0; i < r.count; i++) {
        const index = remainingAtoms.findIndex(
          (a) => a.element.id === r.elementId,
        );
        if (index !== -1) {
          remainingAtoms.splice(index, 1);
        }
      }
    });

    setAtoms(remainingAtoms);

    // Animation delay then show products
    setTimeout(() => {
      const newProducts: string[] = [];
      possibleReaction.products.forEach((p) => {
        for (let i = 0; i < p.count; i++) {
          newProducts.push(p.elementId);
        }
      });

      setProducts(newProducts);
      setChamberColor(possibleReaction.color);
      setEquation(possibleReaction.equation);
      setIsReacting(false);
    }, 1500);
  };

  const handleReset = () => {
    setAtoms([]);
    setProducts([]);
    setIsReacting(false);
    setChamberColor(undefined);
    setEquation("");
    setSelectedReactionName(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            Kimyoviy Reaksiya Simulyatori
          </h1>
          <p className="text-gray-600 text-lg">
            Elementlarni tanlang va reaksiyani kuzating
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Chamber */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <ReactionChamber
              atoms={atoms}
              products={products}
              isReacting={isReacting}
              onAtomClick={removeAtom}
              chamberColor={chamberColor}
            />

            {/* Equation Display */}
            <AnimatePresence>
              {equation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mt-8 w-full"
                >
                  <Card className="bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-gray-500 mb-2 font-medium">
                        Reaksiya tenglamasi
                      </p>
                      <p className="text-2xl font-bold text-gray-800 font-mono">
                        {equation}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Controls */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ControlPanel
              onAddAtom={addAtom}
              onReact={handleReact}
              onReset={handleReset}
              canReact={canReact}
              isReacting={isReacting}
              selectedReaction={selectedReactionName}
            />

            {/* Current Atoms List */}
            <Card className="mt-6 border-0 shadow-md bg-white/60">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  <span>Kolbada atomlar</span>
                  <Badge variant="secondary">{atoms.length}</Badge>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {atoms.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Hali atom qo'shilmagan
                    </p>
                  ) : (
                    atoms.map((atom) => (
                      <Badge
                        key={atom.id}
                        variant="outline"
                        className="text-sm px-3 py-1"
                      >
                        {atom.element.symbol}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6 border-l-4 border-blue-500 bg-blue-50/50">
              <CardContent className="p-4">
                <h4 className="font-bold text-blue-800 mb-2">
                  Qanday ishlatish kerak?
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Element tugmasini bosib kolbaga atom tashlang.</li>
                  <li>
                    To'g'ri nisbatda atomlar yig'ilganda "Reaksiya" tugmasi
                    yoqiladi.
                  </li>
                  <li>Reaksiya tugmasini bosib jarayonni kuzating.</li>
                  <li>
                    Masalan: 2 ta Vodorod (H) va 1 ta Kislorod (O) suv (H₂O)
                    beradi.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default App;
