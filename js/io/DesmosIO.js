/**
 * DesmosIO Class
 * Desmos互換のJSONデータの入出力を担当
 */
export class DesmosIO {

    /**
     * GraPenの曲線リストをDesmos互換のState Objectに変換
     * @param {Array} curves CurveManagerのcurves配列
     * @returns {Object} Desmos State Object
     */
    static exportToDesmosJSON(curves) {
        if (!Array.isArray(curves)) return null;

        const expressions = [];
        let idCounter = 1;

        curves.forEach(curve => {
            if (!curve || curve.isHidden) return; // 必要に応じて非表示も含めるオプションを追加可能

            // 曲線ごとのフォルダを作成
            const folderId = `folder_${curve.id}`;
            expressions.push({
                type: 'folder',
                id: folderId,
                title: `Curve ${curve.id} (${curve.type || 'unknown'})`,
                collapsed: true,
                secret: false
            });

            // 数式を追加
            if (curve.latexEquations && Array.isArray(curve.latexEquations)) {
                curve.latexEquations.forEach((eq, index) => {
                    const latex = eq.latex || eq.formula;
                    if (!latex) return;

                    const expr = {
                        type: 'expression',
                        id: `expr_${curve.id}_${index}`,
                        folderId: folderId,
                        latex: latex,
                        color: curve.color || '#000000',
                        lineStyle: 'SOLID',
                        lineWidth: String(curve.size || 2.5)
                    };

                    // 定義域（ドメイン）の設定
                    if (eq.domain) {
                        // GraPenではドメインは数式に含まれる場合と別の場合があるが、
                        // ここではLatex文字列に"{min < x < max}"の形で付加するか、
                        // Desmosのdomainプロパティを使用するか検討。
                        // Desmos JSONでは、Latex文字列自体に "\{ 0 < x < 1 \}" のように含めるのが一般的だが
                        // propertiesとして指定も可能。ここではシンプルにLatexに結合する形を試みるか、
                        // またはDesmosの仕様に合わせてparametric domainなどを設定する。

                        // 簡単のため、Latex文字列の末尾に条件を追加する方式を採用
                        // もしeq.latexの末尾に既に条件がある場合は注意が必要だが、GraPenのデータ構造による。
                        // ここでは、GraPenのlatexEquationsが純粋な式のみを持っていると仮定し、
                        // domain情報があればそれをTeX形式で付加する。

                        if (eq.domain.type === 'x_range') {
                            // \left\{ start < x < end \right\}
                            const domainLatex = `\\ \\left\\{${eq.domain.start}<x<${eq.domain.end}\\right\\}`;
                            expr.latex = `${latex}${domainLatex}`;
                        }
                    }

                    expressions.push(expr);
                });
            }
        });

        return {
            version: 9,
            randomSeed: "grapen_export",
            graph: {
                viewport: {
                    xmin: -10, ymin: -10, xmax: 10, ymax: 10
                }
            },
            expressions: {
                list: expressions
            }
        };
    }

    /**
     * JSONデータをファイルとしてダウンロードさせる
     * @param {Object} data JSONデータ
     * @param {string} filename ファイル名
     */
    static downloadJSON(data, filename = 'grapen_desmos_export.json') {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
